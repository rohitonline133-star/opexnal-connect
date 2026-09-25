import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { broadcastEvent } from "@/lib/realtime";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export interface InAppNotification extends NotificationRow {
  actor?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified?: boolean;
  } | null;
}

const LOCAL_NOTIFS_KEY = "opexnal_local_notifications";

function getLocalNotifications(userId: string): InAppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_NOTIFS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotification(userId: string, item: InAppNotification) {
  if (typeof window === "undefined") return;
  try {
    const list = getLocalNotifications(userId);
    list.unshift(item);
    localStorage.setItem(`${LOCAL_NOTIFS_KEY}_${userId}`, JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore
  }
}

export async function getNotifications(userId: string): Promise<InAppNotification[]> {
  const local = getLocalNotifications(userId);

  try {
    const { data: rows, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && rows && rows.length > 0) {
      const actorIds = Array.from(
        new Set(rows.map((r) => r.actor_id).filter((id): id is string => Boolean(id))),
      );
      let actorMap = new Map<
        string,
        {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          is_verified?: boolean;
        }
      >();

      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, is_verified")
          .in("id", actorIds);
        if (profiles) {
          actorMap = new Map(profiles.map((p) => [p.id, p]));
        }
      }

      const remoteDecorated: InAppNotification[] = rows.map((r) => ({
        ...r,
        actor: r.actor_id ? (actorMap.get(r.actor_id) ?? null) : null,
      }));

      // Merge remote with any un-synced local
      const remoteIds = new Set(remoteDecorated.map((r) => r.id));
      const filteredLocal = local.filter((l) => !remoteIds.has(l.id));
      return [...remoteDecorated, ...filteredLocal];
    }
  } catch {
    // fallback to local
  }

  return local;
}

export async function createNotification(input: {
  userId: string;
  actorId?: string | null;
  type: string;
  entityId?: string | null;
  entityType?: string | null;
  message: string;
  actorProfile?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}) {
  const localItem: InAppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: input.userId,
    actor_id: input.actorId ?? null,
    type: input.type,
    entity_id: input.entityId ?? null,
    entity_type: input.entityType ?? null,
    message: input.message,
    is_read: false,
    created_at: new Date().toISOString(),
    actor: input.actorProfile ?? null,
  };

  saveLocalNotification(input.userId, localItem);
  broadcastEvent("NEW_NOTIFICATION", localItem);

  try {
    await supabase.from("notifications").insert({
      user_id: input.userId,
      actor_id: input.actorId ?? null,
      type: input.type,
      entity_id: input.entityId ?? null,
      entity_type: input.entityType ?? null,
      message: input.message,
    });
  } catch {
    // handled locally
  }
}

export async function markNotificationRead(notificationId: string, userId?: string) {
  if (userId && typeof window !== "undefined") {
    try {
      const list = getLocalNotifications(userId);
      const found = list.find((item) => item.id === notificationId);
      if (found) {
        found.is_read = true;
        localStorage.setItem(`${LOCAL_NOTIFS_KEY}_${userId}`, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  }

  try {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
  } catch {
    // non-fatal
  }

  broadcastEvent("NOTIFICATION_READ", { id: notificationId });
}

export async function markAllNotificationsRead(userId: string) {
  if (typeof window !== "undefined") {
    try {
      const list = getLocalNotifications(userId);
      for (const item of list) {
        item.is_read = true;
      }
      localStorage.setItem(`${LOCAL_NOTIFS_KEY}_${userId}`, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  try {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  } catch {
    // non-fatal
  }

  broadcastEvent("NOTIFICATION_READ", { all: true, userId });
}
