export type RealtimeEventHandler = (data: unknown) => void;

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<RealtimeEventHandler>> = new Map();
  private token: string | null = null;
  private activeChannels: Set<string> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;

  public setToken(token: string) {
    this.token = token;
    this.reconnect();
  }

  public subscribe(channel: string, event: string, handler: RealtimeEventHandler): () => void {
    const key = `${channel}:${event}`;
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(handler);

    if (!this.activeChannels.has(channel)) {
      this.activeChannels.add(channel);
      this.reconnect();
    }

    return () => {
      set?.delete(handler);
      if (set?.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  public connect(token?: string) {
    if (typeof window === "undefined") return;
    if (token) this.token = token;
    if (!this.token) {
      // Try local storage or cookie
      this.token = localStorage.getItem("opexnal_access_token");
    }
    if (!this.token) return;

    if (this.eventSource) {
      this.eventSource.close();
    }

    const channelsParam = Array.from(this.activeChannels).join(",");
    const url = `/api/v1/realtime/stream?token=${encodeURIComponent(this.token)}${channelsParam ? `&channels=${encodeURIComponent(channelsParam)}` : ""}`;

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      // connected
    };

    this.eventSource.onerror = () => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      // Reconnect with exponential backoff
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, 5000);
      }
    };

    // Generic message dispatcher
    this.eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as { channel: string; event: string; data: unknown };
        const key = `${payload.channel}:${payload.event}`;
        const handlers = this.listeners.get(key);
        if (handlers) {
          handlers.forEach((h) => h(payload.data));
        }
      } catch {
        // ignore parse error
      }
    };
  }

  private reconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.connect();
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const realtimeClient = new RealtimeClient();
