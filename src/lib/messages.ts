import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { FeedAuthor } from "@/lib/posts";

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

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
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
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
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
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
      const ids = memberships.map((m) => m.conversation_id);
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

      const otherIds = Array.from(
        new Set((memberRes.data ?? []).filter((m) => m.user_id !== userId).map((m) => m.user_id)),
      );
      const { data: profiles } = otherIds.length
        ? await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url, is_verified")
            .in("id", otherIds)
        : { data: [] };
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as FeedAuthor]));

      const lastMessage = new Map<string, { body: string; created_at: string }>();
      for (const m of msgRes.data ?? []) {
        if (!lastMessage.has(m.conversation_id)) {
          lastMessage.set(m.conversation_id, { body: m.body, created_at: m.created_at });
        }
      }
      const readMap = new Map((memberships ?? []).map((m) => [m.conversation_id, m.last_read_at]));

      return (convRes.data ?? [])
        .map<ConversationSummary>((c) => {
          const last = lastMessage.get(c.id) ?? null;
          const lastRead = readMap.get(c.id);
          return {
            id: c.id,
            lastMessageAt: c.last_message_at,
            lastMessage: last?.body ?? null,
            others: (memberRes.data ?? [])
              .filter((m) => m.conversation_id === c.id && m.user_id !== userId)
              .map((m) => profileMap.get(m.user_id))
              .filter((p): p is FeedAuthor => Boolean(p)),
            unread: Boolean(last && lastRead && new Date(last.created_at) > new Date(lastRead)),
          };
        })
        .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
    }
  } catch {
    // fallback to seed conversations
  }

  return SEED_CONVERSATIONS;
}

/** Find an existing 1:1 conversation with `otherId`, or create one. */
export async function openDirectConversation(userId: string, otherId: string) {
  const { data: mine } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);
  const ids = (mine ?? []).map((m) => m.conversation_id);

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

export async function getMessages(conversationId: string) {
  const local = getLocalMessages(conversationId);

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      return [...data, ...local];
    }
  } catch {
    // fallback
  }

  const initialSeed: MessageRow[] = [];
  if (conversationId === "conv_maya") {
    initialSeed.push({
      id: "seed_msg_maya_1",
      conversation_id: "conv_maya",
      sender_id: "user_maya",
      body: "Hey! Loved your latest post on the feed. Are you going to the creator meetup?",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    });
  } else if (conversationId === "conv_zenith") {
    initialSeed.push({
      id: "seed_msg_zenith_1",
      conversation_id: "conv_zenith",
      sender_id: "user_zenith",
      body: "The new motion graphics shader is ready for testing! Check it out when you can.",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    });
  }

  return [...initialSeed, ...local];
}

export async function getConversationPeers(conversationId: string, userId: string) {
  try {
    const { data } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId);
    const ids = (data ?? []).map((m) => m.user_id).filter((id) => id !== userId);
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

  const conv = SEED_CONVERSATIONS.find((c) => c.id === conversationId);
  if (conv) {
    return conv.others;
  }
  return [] as FeedAuthor[];
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const newMsg: MessageRow = {
    id: `local_msg_${Date.now()}`,
    conversation_id: conversationId,
    sender_id: senderId,
    body: body.trim(),
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim() });
    if (error) {
      saveLocalMessage(conversationId, newMsg);
    }
  } catch {
    saveLocalMessage(conversationId, newMsg);
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
