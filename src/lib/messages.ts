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

export async function listConversations(userId: string) {
  const { data: memberships, error } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);
  if (error) throw error;

  const ids = (memberships ?? []).map((m) => m.conversation_id);
  if (ids.length === 0) return [] as ConversationSummary[];

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
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getConversationPeers(conversationId: string, userId: string) {
  const { data } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId);
  const ids = (data ?? []).map((m) => m.user_id).filter((id) => id !== userId);
  if (ids.length === 0) return [] as FeedAuthor[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, is_verified")
    .in("id", ids);
  return (profiles ?? []) as FeedAuthor[];
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim() });
  if (error) throw error;
}

export async function markConversationRead(conversationId: string, userId: string) {
  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}
