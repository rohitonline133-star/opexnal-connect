import { validateUserSession } from "../auth/auth-service";

export interface RealtimeMessage {
  channel: string;
  event: string;
  data: unknown;
  timestamp: string;
}

type SSEClient = {
  id: string;
  userId: string;
  channels: Set<string>;
  send: (payload: string) => void;
  close: () => void;
};

class RealtimeBroker {
  private clients: Map<string, SSEClient> = new Map();
  private userClients: Map<string, Set<string>> = new Map();

  public registerClient(client: SSEClient) {
    this.clients.set(client.id, client);
    let uSet = this.userClients.get(client.userId);
    if (!uSet) {
      uSet = new Set();
      this.userClients.set(client.userId, uSet);
    }
    uSet.add(client.id);
  }

  public removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;
    this.clients.delete(clientId);
    const uSet = this.userClients.get(client.userId);
    if (uSet) {
      uSet.delete(clientId);
      if (uSet.size === 0) {
        this.userClients.delete(client.userId);
      }
    }
  }

  public subscribeChannel(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.channels.add(channel);
    }
  }

  public unsubscribeChannel(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.channels.delete(channel);
    }
  }

  public broadcast(channel: string, event: string, data: unknown) {
    const payload: RealtimeMessage = {
      channel,
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    const sseFormatted = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const client of this.clients.values()) {
      if (client.channels.has(channel)) {
        try {
          client.send(sseFormatted);
        } catch {
          this.removeClient(client.id);
        }
      }
    }
  }

  public getConnectedUsersCount(): number {
    return this.userClients.size;
  }
}

export const realtimeBroker = new RealtimeBroker();

/**
 * Handles incoming SSE request from client.
 */
export async function handleRealtimeSseConnection(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      JSON.stringify({ error: "Missing authorization token for realtime stream" }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const session = await validateUserSession(token);
  if (!session.valid || !session.user) {
    return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const userId = session.user.userId;
  const clientId = `sse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Default channels: user-specific inbox and presence
  const initialChannels = new Set<string>([`user:${userId}`, "presence"]);
  const extraChannels = url.searchParams.get("channels")?.split(",") ?? [];
  for (const ch of extraChannels) {
    const trimmed = ch.trim();
    if (trimmed) initialChannels.add(trimmed);
  }

  let pingInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        controller.enqueue(encoder.encode(data));
      };

      // Register client
      realtimeBroker.registerClient({
        id: clientId,
        userId,
        channels: initialChannels,
        send,
        close: () => {
          if (pingInterval) clearInterval(pingInterval);
          try {
            controller.close();
          } catch {
            // ignore
          }
        },
      });

      // Initial connection acknowledgment
      send(
        `event: connected\ndata: ${JSON.stringify({ clientId, userId, status: "connected" })}\n\n`,
      );

      // 15-second heartbeat ping to prevent proxy connection timeout
      pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          if (pingInterval) clearInterval(pingInterval);
          realtimeBroker.removeClient(clientId);
        }
      }, 15000);
    },
    cancel() {
      if (pingInterval) clearInterval(pingInterval);
      realtimeBroker.removeClient(clientId);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Public helper to publish events anywhere in the backend (messages, notifications, likes).
 */
export function publishRealtimeEvent(channel: string, event: string, data: unknown) {
  realtimeBroker.broadcast(channel, event, data);
}
