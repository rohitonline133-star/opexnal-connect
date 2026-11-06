import { supabase } from "@/integrations/supabase/client";
import { authClient } from "@/lib/auth-client";
import type { Database } from "@/integrations/supabase/types";
import type { FeedAuthor } from "@/lib/posts";
import { apiUrl } from "@/lib/api-client";

const IS_DEV_ENVIRONMENT =
  import.meta.env?.DEV ??
  (typeof process !== "undefined" && process.env["NODE_ENV"] !== "production");

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type Message = MessageRow;

export type ConversationSummary = {
  id: string;
  lastMessageAt: string;
  lastMessage: string | null;
  others: FeedAuthor[];
  unread: boolean;
};

async function messagesApiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(authClient.getAuthHeader());
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(apiUrl(path), { ...init, headers, cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok)
    throw new Error(payload.error || `Messaging API request failed (${response.status}).`);
  return payload;
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== userId) {
    throw new Error("Verified authentication is required to list conversations.");
  }
  const payload = await messagesApiRequest<{
    conversations?: Array<{
      id: string;
      last_message_at: string;
      last_message: string | null;
      unread: boolean;
      others: FeedAuthor[];
    }>;
  }>("/api/v1/messages/conversations");
  return (payload.conversations || []).map((conversation) => ({
    id: conversation.id,
    lastMessageAt: conversation.last_message_at,
    lastMessage: conversation.last_message,
    others: conversation.others || [],
    unread: Boolean(conversation.unread),
  }));
}

/** Find an existing 1:1 conversation with otherId, or create one on the API. */
export async function openDirectConversation(userId: string, otherId: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== userId) {
    throw new Error("Verified authentication is required to open a conversation.");
  }
  const payload = await messagesApiRequest<{ conversation?: { id?: string } }>(
    "/api/v1/messages/conversations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: otherId }),
    },
  );
  if (!payload.conversation?.id) throw new Error("The API did not return a conversation.");
  return payload.conversation.id;
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  const payload = await messagesApiRequest<{ messages?: MessageRow[] }>(
    `/api/v1/messages/${encodeURIComponent(conversationId)}`,
  );
  return payload.messages || [];
}

export async function getConversationPeers(
  conversationId: string,
  userId: string,
): Promise<FeedAuthor[]> {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== userId) {
    throw new Error("Verified authentication is required to load conversation members.");
  }
  const payload = await messagesApiRequest<{ members?: FeedAuthor[] }>(
    `/api/v1/messages/${encodeURIComponent(conversationId)}/members`,
  );
  return payload.members || [];
}

export type SendMessagePayload = {
  conversationId: string;
  sender: { id: string; username?: string; avatar_url?: string | null };
  text: string;
};

export type SentMessageResult = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  text: string;
  created_at: string;
};

export async function sendMessage(
  conversationIdOrPayload: string | SendMessagePayload,
  senderId?: string,
  body?: string,
): Promise<SentMessageResult> {
  const convId =
    typeof conversationIdOrPayload === "object"
      ? conversationIdOrPayload.conversationId
      : conversationIdOrPayload;
  const textBody =
    typeof conversationIdOrPayload === "object" ? conversationIdOrPayload.text : body || "";
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id || (senderId && senderId !== data.user.id)) {
    throw new Error("Verified authentication is required to send a message.");
  }
  const payload = await messagesApiRequest<{ message?: Omit<SentMessageResult, "text"> }>(
    `/api/v1/messages/${encodeURIComponent(convId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: textBody.trim() }),
    },
  );
  if (!payload.message) throw new Error("The API did not return the sent message.");
  return { ...payload.message, text: payload.message.body };
}

export async function deleteMessage(messageId: string, requestingUserId?: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id || (requestingUserId && requestingUserId !== data.user.id)) {
    throw new Error("Verified authentication is required to delete a message.");
  }
  await messagesApiRequest<{ success: boolean }>(
    `/api/v1/messages/${encodeURIComponent(messageId)}`,
    { method: "DELETE" },
  );
}

export async function markConversationRead(conversationId: string, userId: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== userId) {
    throw new Error("Verified authentication is required to mark a conversation read.");
  }
  await messagesApiRequest<{ success: boolean }>(
    `/api/v1/messages/${encodeURIComponent(conversationId)}/read`,
    { method: "POST" },
  );
}

/** Local-only reaction state is development-only; production reactions use the API below. */
const LOCAL_MESSAGE_REACTIONS_KEY = "opexnal_message_reactions";
const memoryMessageReactions: Record<string, string> = {};

export function getMessageReactions(): Record<string, string> {
  if (!IS_DEV_ENVIRONMENT || typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGE_REACTIONS_KEY);
    return raw ? JSON.parse(raw) : memoryMessageReactions;
  } catch {
    return memoryMessageReactions;
  }
}

export function setMessageReaction(messageId: string, emoji: string) {
  if (!IS_DEV_ENVIRONMENT) return;
  memoryMessageReactions[messageId] = emoji;
  if (typeof window === "undefined") return;
  try {
    const current = getMessageReactions();
    current[messageId] = emoji;
    localStorage.setItem(LOCAL_MESSAGE_REACTIONS_KEY, JSON.stringify(current));
  } catch {
    // Development-only convenience state.
  }
}

export async function fetchMessageReactions(conversationId: string) {
  const payload = await messagesApiRequest<{
    reactions?: Array<{ message_id: string; emoji: string }>;
  }>(`/api/v1/messages/${encodeURIComponent(conversationId)}/reactions`);
  return Object.fromEntries(
    (payload.reactions || []).map((reaction) => [reaction.message_id, reaction.emoji]),
  );
}

/**
 * Subscribe to first-party message events. The short-lived ticket keeps the
 * session token out of the WebSocket URL; polling remains as a fallback.
 */
export function subscribeToMessageEvents(
  onMessageCreated: () => void,
  onNotificationCreated?: () => void,
): () => void {
  let socket: WebSocket | null = null;
  let cancelled = false;

  void (async () => {
    try {
      const response = await fetch(apiUrl("/api/v1/auth/websocket-ticket"), {
        method: "POST",
        headers: authClient.getAuthHeader(),
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json().catch(() => ({}))) as { ticket?: string };
      if (!payload.ticket || cancelled || typeof window === "undefined") return;

      const configuredUrl = apiUrl("/ws");
      const socketUrl = /^https?:\/\//i.test(configuredUrl)
        ? configuredUrl.replace(/^http/i, "ws")
        : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
      socket = new WebSocket(`${socketUrl}?ticket=${encodeURIComponent(payload.ticket)}`);
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(String(event.data)) as { type?: string };
          if (message.type === "message.created") onMessageCreated();
          if (message.type === "notification.created") onNotificationCreated?.();
        } catch {
          // Ignore malformed events; the API polling fallback will recover state.
        }
      });
    } catch {
      // WebSocket is an enhancement; existing API polling remains available.
    }
  })();

  return () => {
    cancelled = true;
    socket?.close();
  };
}

export async function updateMessageReaction(messageId: string, emoji: string) {
  await messagesApiRequest<{ reaction: { message_id: string; emoji: string } | null }>(
    `/api/v1/messages/${encodeURIComponent(messageId)}/reaction`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    },
  );
}
