import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bell,
  Check,
  Heart,
  Loader2,
  MessageCircle,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/posts";
import { initialsFor } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: "Activity & Notifications — Opexnal" },
      {
        name: "description",
        content: "Follow requests, new followers, likes and interactions on your Opexnal account.",
      },
      { property: "og:title", content: "Activity & Notifications — Opexnal" },
      {
        property: "og:description",
        content: "Follow requests, new followers and likes on Opexnal.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Activity,
});

type Person = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified?: boolean;
};

function Activity() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"all" | "requests" | "followers" | "interactions">("all");

  // Follow Requests
  const requests = useQuery({
    queryKey: ["follow-requests", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_requests")
        .select(
          "id, created_at, requester:profiles!follow_requests_requester_id_fkey(id, username, display_name, avatar_url, is_verified)",
        )
        .eq("target_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; created_at: string; requester: Person }[];
    },
  });

  // Recent Followers
  const followers = useQuery({
    queryKey: ["recent-followers", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select(
          "created_at, follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, is_verified)",
        )
        .eq("following_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as { created_at: string; follower: Person }[];
    },
  });

  // Post Likes & Comments notifications
  const interactions = useQuery({
    queryKey: ["recent-likes", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      // Fetch user's own posts to find likes
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", user!.id)
        .limit(20);

      const postIds = (userPosts ?? []).map((p) => p.id);
      if (postIds.length === 0) return [];

      const { data: likes, error } = await supabase
        .from("post_likes")
        .select(
          "post_id, created_at, user:profiles(id, username, display_name, avatar_url, is_verified)",
        )
        .in("post_id", postIds)
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) throw error;
      return (likes ?? []) as unknown as {
        post_id: string;
        created_at: string;
        user: Person;
      }[];
    },
  });

  async function respond(requestId: string, accept: boolean) {
    const { error } = accept
      ? await supabase.rpc("accept_follow_request", { _request_id: requestId })
      : await supabase.from("follow_requests").delete().eq("id", requestId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(accept ? "Follower accepted" : "Request declined");
    await queryClient.invalidateQueries({ queryKey: ["follow-requests", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["recent-followers", user?.id] });
  }

  async function followBack(personId: string, personUsername: string) {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc("request_follow", { _target_id: personId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(
        data === "requested" ? "Follow request sent" : `Following back @${personUsername}`,
      );
      await queryClient.invalidateQueries({ queryKey: ["recent-followers", user?.id] });
    } catch {
      toast.error("Could not follow user");
    }
  }

  const loading = requests.isLoading || followers.isLoading || interactions.isLoading;
  const requestCount = requests.data?.length ?? 0;

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Activity"
          right={
            requestCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full brand-gradient-bg px-2 text-[10px] font-bold text-primary-foreground">
                {requestCount} new
              </span>
            )
          }
        />
      }
    >
      <div className="px-3 sm:px-4 py-3 space-y-3.5 max-w-lg mx-auto">
        {/* Activity Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "All Activity" },
            { id: "requests", label: `Requests ${requestCount > 0 ? `(${requestCount})` : ""}` },
            { id: "interactions", label: "Likes & Comments" },
            { id: "followers", label: "Followers" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as typeof tab)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border",
                tab === t.id
                  ? "brand-gradient-bg text-primary-foreground border-primary shadow-xs"
                  : "bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Follow Requests Section */}
            {(tab === "all" || tab === "requests") && requestCount > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Follow Requests</span>
                  <span className="text-primary font-bold">{requestCount} pending</span>
                </h2>
                <div className="divide-y divide-border rounded-2xl border border-primary/20 bg-surface overflow-hidden shadow-xs">
                  {requests.data?.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-secondary/40"
                    >
                      <Link
                        to="/u/$username"
                        params={{ username: req.requester.username }}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <ProfileAvatar
                          path={req.requester.avatar_url}
                          fallback={initialsFor(req.requester)}
                          className="h-11 w-11"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate text-xs sm:text-sm font-semibold">
                            @{req.requester.username}
                            {req.requester.is_verified && (
                              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                            )}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            Requested {timeAgo(req.created_at)}
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => respond(req.id, true)}
                          className="h-8 rounded-xl brand-gradient-bg text-primary-foreground text-xs font-semibold px-3"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => respond(req.id, false)}
                          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Likes & Interactions Section */}
            {(tab === "all" || tab === "interactions") && (interactions.data?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> Interactions
                </h2>
                <div className="divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden">
                  {interactions.data?.map((interaction, i) => (
                    <Link
                      key={`${interaction.post_id}-${interaction.user.id}-${i}`}
                      to="/p/$postId"
                      params={{ postId: interaction.post_id }}
                      className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative">
                          <ProfileAvatar
                            path={interaction.user.avatar_url}
                            fallback={initialsFor(interaction.user)}
                            className="h-10 w-10"
                          />
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white">
                            <Heart className="h-2.5 w-2.5 fill-white" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm">
                            <span className="font-semibold text-foreground">
                              @{interaction.user.username}
                            </span>{" "}
                            liked your post
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {timeAgo(interaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-primary">View</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Followers Section */}
            {(tab === "all" || tab === "followers") && (followers.data?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> Recent Followers
                </h2>
                <div className="divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden">
                  {followers.data?.map((item) => (
                    <div
                      key={`${item.follower.id}-${item.created_at}`}
                      className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-secondary/40"
                    >
                      <Link
                        to="/u/$username"
                        params={{ username: item.follower.username }}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <ProfileAvatar
                          path={item.follower.avatar_url}
                          fallback={initialsFor(item.follower)}
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate text-xs sm:text-sm font-semibold">
                            @{item.follower.username}
                            {item.follower.is_verified && (
                              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Followed {timeAgo(item.created_at)}
                          </p>
                        </div>
                      </Link>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => followBack(item.follower.id, item.follower.username)}
                        className="h-8 rounded-xl text-xs font-semibold border-border hover:border-primary hover:text-primary"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Follow Back
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!requestCount && !interactions.data?.length && !followers.data?.length && (
              <div className="flex flex-col items-center px-8 py-20 text-center rounded-2xl border border-dashed border-border bg-surface">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-3">
                  <Bell className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">No recent activity</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  When people follow you, like your posts, or send follow requests, they'll appear
                  right here.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-4 brand-gradient-bg text-primary-foreground text-xs"
                >
                  <Link to="/explore">Explore Creators</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
