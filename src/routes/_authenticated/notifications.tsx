import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Check, Heart, MessageCircle, ShieldAlert, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications & Activity — Opexnal" },
      { name: "description", content: "Real activity and follow requests on Opexnal." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

interface NotificationItem {
  id: string;
  notification_type: string;
  target_type: string | null;
  target_id: string | null;
  target_summary: string | null;
  actor_id: string | null;
  actor_username: string | null;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
  read_at: string | null;
  created_at: string;
}

interface FollowRequest {
  id: string;
  requester_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleString();
}

function notificationText(item: NotificationItem) {
  const actor = item.actor_username ? `@${item.actor_username}` : "An account";
  switch (item.notification_type) {
    case "new_follower": return `${actor} started following you.`;
    case "follow_request": return `${actor} requested to follow you.`;
    case "follow_accepted": return `${actor} accepted your follow request.`;
    case "post_like": return `${actor} liked your post.`;
    case "post_comment": return `${actor} commented on your post.`;
    case "message": return `${actor} sent you a message.`;
    default: return `${actor} interacted with your account.`;
  }
}

function NotificationIcon({ type }: { type: string }) {
  if (type.includes("like")) return <Heart className="h-4 w-4 text-rose-500" />;
  if (type.includes("comment")) return <MessageCircle className="h-4 w-4 text-blue-500" />;
  if (type.includes("follower") || type.includes("follow")) return <UserPlus className="h-4 w-4 text-primary" />;
  if (type.includes("message")) return <MessageCircle className="h-4 w-4 text-primary" />;
  if (type.includes("security")) return <ShieldAlert className="h-4 w-4 text-amber-500" />;
  return <Bell className="h-4 w-4 text-muted-foreground" />;
}

function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const headers = authClient.getAuthHeader();
      const [notificationResponse, requestResponse] = await Promise.all([
        fetch("/api/v1/notifications?limit=100", { headers, cache: "no-store" }),
        fetch("/api/v1/follow-requests", { headers, cache: "no-store" }),
      ]);
      const [notificationPayload, requestPayload] = await Promise.all([
        notificationResponse.json().catch(() => ({})),
        requestResponse.json().catch(() => ({})),
      ]) as [
        { notifications?: NotificationItem[]; unreadCount?: number; error?: string },
        { requests?: FollowRequest[]; error?: string },
      ];
      if (!notificationResponse.ok) throw new Error(notificationPayload.error || "Could not load notifications.");
      if (!requestResponse.ok) throw new Error(requestPayload.error || "Could not load follow requests.");
      setNotifications(notificationPayload.notifications || []);
      setUnreadCount(notificationPayload.unreadCount || 0);
      setFollowRequests(requestPayload.requests || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function respondToFollowRequest(requestId: string, decision: "accept" | "reject") {
    setActionId(requestId);
    try {
      const response = await fetch(`/api/v1/follow-requests/${encodeURIComponent(requestId)}/${decision}`, {
        method: "POST",
        headers: authClient.getAuthHeader(),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Follow request update failed.");
      setFollowRequests((previous) => previous.filter((request) => request.id !== requestId));
      toast.success(decision === "accept" ? "Follow request accepted." : "Follow request declined.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Follow request update failed.");
    } finally {
      setActionId(null);
    }
  }

  async function markAllRead() {
    try {
      const response = await fetch("/api/v1/notifications/read-all", {
        method: "POST",
        headers: authClient.getAuthHeader(),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not mark notifications read.");
      setNotifications((previous) => previous.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not mark notifications read.");
    }
  }

  async function markRead(item: NotificationItem) {
    if (item.read_at) return;
    try {
      const response = await fetch(`/api/v1/notifications/${encodeURIComponent(item.id)}/read`, {
        method: "PATCH",
        headers: authClient.getAuthHeader(),
      });
      if (!response.ok) return;
      setNotifications((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch {
      // The notification remains unread if the request fails.
    }
  }

  return (
    <AppShell activeTab="activity">
      <div className="mx-auto min-h-screen max-w-xl pb-20">
        <ScreenHeader title="Notifications" showBack onBack={() => navigate({ to: "/home" })} />
        <div className="space-y-5 p-4">
          {errorMessage && <p role="alert" className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">{errorMessage}</p>}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-foreground">Follow requests</h2>
                <p className="text-xs text-muted-foreground">Requests for your private account.</p>
              </div>
              {followRequests.length > 0 && <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{followRequests.length}</span>}
            </div>
            {loading ? (
              <div className="flex justify-center py-5"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : followRequests.length === 0 ? (
              <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">No pending follow requests.</p>
            ) : followRequests.map((request) => (
              <article key={request.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {request.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">@{request.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{request.display_name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(request.created_at)}</p>
                </div>
                <Button size="sm" disabled={actionId === request.id} onClick={() => void respondToFollowRequest(request.id, "accept")}>
                  <Check className="mr-1 h-3.5 w-3.5" /> Accept
                </Button>
                <Button size="sm" variant="outline" disabled={actionId === request.id} onClick={() => void respondToFollowRequest(request.id, "reject")}>Decline</Button>
              </article>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-foreground">Activity</h2>
                <p className="text-xs text-muted-foreground">{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</p>
              </div>
              {unreadCount > 0 && <Button size="sm" variant="ghost" onClick={() => void markAllRead()}>Mark all read</Button>}
            </div>
            {!loading && notifications.length === 0 ? (
              <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">No activity yet.</p>
            ) : notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void markRead(item)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${item.read_at ? "border-border bg-surface" : "border-primary/30 bg-primary/5"}`}
              >
                <div className="mt-0.5 rounded-xl bg-muted p-2"><NotificationIcon type={item.notification_type} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{notificationText(item)}</p>
                  {item.target_summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.target_summary}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(item.created_at)}</p>
                </div>
                {!item.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            ))}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
