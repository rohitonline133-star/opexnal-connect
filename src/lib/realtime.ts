import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { MessageRow } from "@/lib/messages";

export interface NotificationPayload {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_id: string | null;
  entity_type: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Global Realtime Manager for In-App Notifications, Follows, and Multi-tab Broadcast Sync.
 */
export function useRealtimeNotifications(userId?: string | null) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // 1. BroadcastChannel for cross-tab instant state synchronization
    let broadcast: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        broadcast = new BroadcastChannel("opexnal_realtime_sync");
        broadcast.onmessage = (event) => {
          const { type } = event.data || {};
          if (type === "NEW_NOTIFICATION" || type === "NOTIFICATION_READ") {
            queryClient.invalidateQueries({ queryKey: ["in-app-notifications", userId] });
            queryClient.invalidateQueries({ queryKey: ["follow-requests", userId] });
            queryClient.invalidateQueries({ queryKey: ["recent-likes", userId] });
            queryClient.invalidateQueries({ queryKey: ["recent-followers", userId] });
          } else if (type === "NEW_POST" || type === "POST_LIKED") {
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["home-feed"] });
          } else if (type === "NEW_MESSAGE") {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          }
        };
      }
    } catch {
      // BroadcastChannel optional fallback
    }

    // 2. Supabase Postgres Realtime subscription for user's notifications
    const channelName = `user_notifications_${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationPayload;
          // Invalidate React Query caches
          queryClient.invalidateQueries({ queryKey: ["in-app-notifications", userId] });
          queryClient.invalidateQueries({ queryKey: ["follow-requests", userId] });
          queryClient.invalidateQueries({ queryKey: ["recent-likes", userId] });
          queryClient.invalidateQueries({ queryKey: ["recent-followers", userId] });

          // Inform user via toast
          toast(newNotif.message || "New notification received", {
            description: "Activity on Opexnal",
            duration: 4000,
          });

          // Broadcast to other tabs
          try {
            broadcast?.postMessage({ type: "NEW_NOTIFICATION", payload: newNotif });
          } catch {
            // ignore
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "follow_requests",
          filter: `target_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["follow-requests", userId] });
          toast("New follow request received", {
            description: "Review pending requests in Activity",
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (broadcast) {
        broadcast.close();
      }
    };
  }, [userId, queryClient]);
}

/**
 * Realtime hook for active 1:1 or group conversation messages
 */
export function useRealtimeConversation(
  conversationId: string | null | undefined,
  onNewMessage?: (msg: MessageRow) => void,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channelName = `chat_conv_${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          if (onNewMessage) {
            onNewMessage(newMsg);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onNewMessage, queryClient]);
}

/**
 * Broadcast event helper to synchronize across browser tabs/windows
 */
export function broadcastEvent(type: string, data?: unknown) {
  if (typeof window === "undefined") return;
  try {
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("opexnal_realtime_sync");
      bc.postMessage({ type, data });
      bc.close();
    }
  } catch {
    // ignore
  }
}
