import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { FeedAuthor } from "@/lib/posts";

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type Message = MessageRow;

export type ConversationSummary = {
  id: string;
  lastMessageAt: string;
  lastMessage: string | null;
  others: FeedAuthor[];
  unread: boolean;
};

const SEED_CONVERSATIONS: ConversationSummary[] = [
  {
    id: "conv_maya",
    lastMessageAt: "2026-10-14T08:45:00.000Z",
    lastMessage: "Hey! Loved your latest post on the feed. Are you going to the creator meetup?",
    others: [
      {
        id: "user_maya",
        username: "maya_codes",
        display_name: "Maya Chen",
        avatar_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        is_verified: true,
      },
    ],
    unread: true,
  },
  {
    id: "conv_zenith",
    lastMessageAt: "2026-10-14T07:00:00.000Z",
    lastMessage: "The new motion graphics shader is ready for testing! Check it out when you can.",
    others: [
      {
        id: "user_zenith",
        username: "zenith_design",
        display_name: "Zenith Creative",
        avatar_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        is_verified: true,
      },
    ],
    unread: false,
  },
];

const LOCAL_MESSAGES_KEY = "opexnal_local_messages";

function getLocalMessages(conversationId: string): MessageRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_MESSAGES_KEY}_${conversationId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessage(conversationId: string, msg: MessageRow) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalMessages(conversationId);
    current.push(msg);
    localStorage.setItem(`${LOCAL_MESSAGES_KEY}_${conversationId}`, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export async function listConversations(userId: string) {
  try {
    const { data: memberships, error } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);
    if (!error && memberships && memberships.length > 0) {
      const ids = (memberships as Array<{ conversation_id: string; last_read_at: string }>).map(
        (m) => m.conversation_id,
      );
      const [convRes, memberRes, msgRes] = await Promise.all([
        supabase.from("conversations").select("id, last_message_at").in("id", ids),
        supabase
          .from("conversation_members")
          .select("conversation_id, user_id")
          .in("conversation_id", ids),
        supabase
          .from("messages")
          .select("conversation_id, body, created_at")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false }),
      ]);

      const memberRows = (memberRes.data ?? []) as Array<{
        conversation_id: string;
        user_id: string;
      }>;
      const otherIds = Array.from(
        new Set(memberRows.filter((m) => m.user_id !== userId).map((m) => m.user_id)),
      );
      const { data: profiles } = otherIds.length
        ? await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url, is_verified")
            .in("id", otherIds)
        : { data: [] };
      const profileMap = new Map(((profiles ?? []) as Array<FeedAuthor>).map((p) => [p.id, p]));

      const lastMessage = new Map<string, { body: string; created_at: string }>();
      const msgRows = (msgRes.data ?? []) as Array<{
        conversation_id: string;
        body: string;
        created_at: string;
      }>;
      for (const m of msgRows) {
        if (!lastMessage.has(m.conversation_id)) {
          lastMessage.set(m.conversation_id, { body: m.body, created_at: m.created_at });
        }
      }
      const readMap = new Map(
        (memberships as Array<{ conversation_id: string; last_read_at: string }>).map((m) => [
          m.conversation_id,
          m.last_read_at,
        ]),
      );

      const convRows = (convRes.data ?? []) as Array<{ id: string; last_message_at: string }>;
      return convRows
        .map((c): ConversationSummary => {
          const last = lastMessage.get(c.id) ?? null;
          const lastRead = readMap.get(c.id);
          return {
            id: c.id,
            lastMessageAt: c.last_message_at,
            lastMessage: last?.body ?? null,
            others: memberRows
              .filter((m) => m.conversation_id === c.id && m.user_id !== userId)
              .map((m) => profileMap.get(m.user_id))
              .filter((p): p is FeedAuthor => Boolean(p)),
            unread: Boolean(
              last && lastRead && new Date(last.created_at) > new Date(String(lastRead)),
            ),
          };
        })
        .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
    }
  } catch {
    // Return empty if error or not yet participating in conversations
  }

  return [];
}

/** Find an existing 1:1 conversation with `otherId`, or create one. */
export async function openDirectConversation(userId: string, otherId: string) {
  const { data: mine } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);
  const memberList = (mine ?? []) as Array<{ conversation_id: string }>;
  const ids = memberList.map((m) => m.conversation_id);

  if (ids.length > 0) {
    const { data: shared } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", otherId)
      .in("conversation_id", ids);
    const candidate = (shared ?? [])[0]?.conversation_id;
    if (candidate) return candidate;
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ created_by: userId })
    .select("id")
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase.from("conversation_members").insert([
    { conversation_id: conversation.id, user_id: userId },
    { conversation_id: conversation.id, user_id: otherId },
  ]);
  if (memberError) throw memberError;

  return conversation.id;
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      return data;
    }
  } catch {
    // Return empty array
  }
  return [];
}

export async function getConversationPeers(
  conversationId: string,
  userId: string,
): Promise<FeedAuthor[]> {
  try {
    const { data } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId);
    const memberList = (data ?? []) as Array<{ user_id: string }>;
    const ids = memberList.map((m) => m.user_id).filter((id) => id !== userId);
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_verified")
        .in("id", ids);
      if (profiles && profiles.length > 0) {
        return profiles as FeedAuthor[];
      }
    }
  } catch {
    // fallback
  }

  return [];
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
  let convId: string;
  let sId: string;
  let textBody: string;

  if (typeof conversationIdOrPayload === "object") {
    convId = conversationIdOrPayload.conversationId;
    sId = conversationIdOrPayload.sender.id;
    textBody = conversationIdOrPayload.text;
  } else {
    convId = conversationIdOrPayload;
    sId = senderId || "user_maya";
    textBody = body || "";
  }

  const { data: authData } = await supabase.auth.getUser();
  const effectiveSenderId = authData?.user?.id || sId;
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const { error } = await supabase.from("messages").insert({
    id: messageId,
    conversation_id: convId,
    sender_id: effectiveSenderId,
    body: textBody.trim(),
    created_at: now,
  });

  if (error) {
    throw error;
  }

  return {
    id: messageId,
    conversation_id: convId,
    sender_id: effectiveSenderId,
    body: textBody.trim(),
    text: textBody.trim(),
    created_at: now,
  };
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase.from("messages").delete().eq("id", messageId);
  if (error) throw error;
}

const LOCAL_MESSAGE_REACTIONS_KEY = "opexnal_message_reactions";

const memoryMessageReactions: Record<string, string> = {};

export function getMessageReactions(): Record<string, string> {
  if (typeof window === "undefined") {
    return memoryMessageReactions;
  }
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGE_REACTIONS_KEY);
    return raw ? JSON.parse(raw) : memoryMessageReactions;
  } catch {
    return memoryMessageReactions;
  }
}

export function setMessageReaction(messageId: string, emoji: string) {
  memoryMessageReactions[messageId] = emoji;
  if (typeof window === "undefined") return;
  try {
    const current = getMessageReactions();
    current[messageId] = emoji;
    localStorage.setItem(LOCAL_MESSAGE_REACTIONS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export async function markConversationRead(conversationId: string, userId: string) {
  try {
    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
  } catch {
    // ignore
  }
}
