import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronLeft,
  Copy,
  EyeOff,
  Flag,
  Link as LinkIcon,
  Loader2,
  Lock,
  MoreHorizontal,
  Share2,
  ShieldAlert,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { PostGrid } from "@/components/opexnal/post-grid";
import { ReportContentDialog } from "@/components/opexnal/post-controls";
import { ShareProfileDialog } from "@/components/opexnal/share-profile-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getProfileByUsername, initialsFor } from "@/lib/profile";
import { useSession } from "@/hooks/use-session";
import { openDirectConversation } from "@/lib/messages";

export const Route = createFileRoute("/_authenticated/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Opexnal` },
      { name: "description", content: `View @${params.username}'s profile on Opexnal.` },
      { property: "og:title", content: `@${params.username} — Opexnal` },
      { property: "og:description", content: `View @${params.username}'s profile on Opexnal.` },
      { property: "og:type", content: "profile" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicProfile,
});

function PublicProfile() {
  const { username } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-by-username", username],
    queryFn: () => getProfileByUsername(username),
  });

  const isSelf = Boolean(user && profile && user.id === profile.id);

  async function handleBlock() {
    if (!user || !profile) return;
    try {
      await supabase.from("blocks").insert({
        blocker_id: user.id,
        blocked_id: profile.id,
      });
      toast.success(`Blocked @${profile.username}`);
      setMenuOpen(false);
      navigate({ to: "/explore" });
    } catch {
      toast.error("Could not block user");
    }
  }

  function handleRestrict() {
    if (!profile) return;
    toast.success(`Restricted @${profile.username}`);
    setMenuOpen(false);
  }

  function handleCopyProfileLink() {
    const url = `${window.location.origin}/u/${username}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied");
    setMenuOpen(false);
  }

  const { data: relationship } = useQuery({
    queryKey: ["relationship", user?.id, profile?.id],
    enabled: Boolean(user?.id && profile?.id) && !isSelf,
    queryFn: async () => {
      const [follow, request] = await Promise.all([
        supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user!.id)
          .eq("following_id", profile!.id)
          .maybeSingle(),
        supabase
          .from("follow_requests")
          .select("id")
          .eq("requester_id", user!.id)
          .eq("target_id", profile!.id)
          .maybeSingle(),
      ]);
      return { following: Boolean(follow.data), requested: Boolean(request.data) };
    },
  });

  async function toggleFollow() {
    if (!user || !profile) return;
    if (relationship?.following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Unfollowed @${profile.username}`);
    } else if (relationship?.requested) {
      const { error } = await supabase
        .from("follow_requests")
        .delete()
        .eq("requester_id", user.id)
        .eq("target_id", profile.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Request withdrawn");
    } else {
      const { data, error } = await supabase.rpc("request_follow", { _target_id: profile.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(
        data === "requested" ? "Follow request sent" : `Following @${profile.username}`,
      );
    }
    await queryClient.invalidateQueries({ queryKey: ["relationship", user.id, profile.id] });
    await queryClient.invalidateQueries({ queryKey: ["profile-by-username", username] });
  }

  return (
    <AppShell
      header={
        <ScreenHeader
          title={`@${username}`}
          left={
            <Link
              to="/explore"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
          right={
            profile && !isSelf ? (
              <button
                type="button"
                aria-label="Account options"
                onClick={() => setMenuOpen(true)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            ) : null
          }
        />
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : !profile ? (
        <p className="px-6 py-24 text-center text-sm text-muted-foreground">
          This account doesn't exist.
        </p>
      ) : (
        <div>
          <div className="flex items-center gap-5 px-4 pt-6">
            <ProfileAvatar
              path={profile.avatar_url}
              fallback={initialsFor(profile)}
              className="h-20 w-20 text-lg"
              ring
            />
            <dl className="flex flex-1 justify-around text-center">
              <div>
                <dt className="text-xs text-muted-foreground">Posts</dt>
                <dd className="text-lg font-semibold">{profile.posts_count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Followers</dt>
                <dd className="text-lg font-semibold">{profile.followers_count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Following</dt>
                <dd className="text-lg font-semibold">{profile.following_count}</dd>
              </div>
            </dl>
          </div>

          <div className="px-4 pt-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              {profile.display_name || profile.username}
              {profile.is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified" />
              )}
            </p>
            {profile.bio && <p className="mt-2 whitespace-pre-line text-sm">{profile.bio}</p>}
          </div>

          {!isSelf && (
            <div className="flex gap-2 px-4 pt-4">
              <Button
                variant={relationship?.following || relationship?.requested ? "surface" : "brand"}
                size="xl"
                onClick={toggleFollow}
              >
                {relationship?.following
                  ? "Following"
                  : relationship?.requested
                    ? "Requested"
                    : profile.is_private
                      ? "Request to follow"
                      : "Follow"}
              </Button>
              <Button
                variant="surface"
                size="xl"
                onClick={async () => {
                  if (!user) return;
                  try {
                    const id = await openDirectConversation(user.id, profile.id);
                    navigate({ to: "/messages/$conversationId", params: { conversationId: id } });
                  } catch {
                    toast.error("Could not open the conversation");
                  }
                }}
              >
                Message
              </Button>
            </div>
          )}

          <div className="mt-8 border-t border-border">
            {profile.is_private && !relationship?.following && !isSelf ? (
              <div className="flex flex-col items-center px-8 py-20 text-center">
                <Lock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold">This account is private</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Follow this account to see their posts.
                </p>
              </div>
            ) : (
              <PostGrid userId={profile.id} viewerId={user?.id ?? null} />
            )}
          </div>

          {/* User Options Menu Dialog */}
          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogContent className="max-w-xs p-0 overflow-hidden rounded-2xl bg-card border border-border">
              <div className="divide-y divide-border text-center text-sm font-medium">
                <button
                  type="button"
                  onClick={handleBlock}
                  className="w-full py-3.5 text-destructive font-semibold hover:bg-secondary/50 flex items-center justify-center gap-2"
                >
                  <UserX className="h-4 w-4" />
                  Block @{profile.username}
                </button>
                <button
                  type="button"
                  onClick={handleRestrict}
                  className="w-full py-3.5 text-destructive hover:bg-secondary/50 flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Restrict @{profile.username}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  className="w-full py-3.5 text-destructive font-semibold hover:bg-secondary/50 flex items-center justify-center gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Report Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShareOpen(true);
                  }}
                  className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  Share Profile
                </button>
                <button
                  type="button"
                  onClick={handleCopyProfileLink}
                  className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
                >
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  Copy Profile URL
                </button>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="w-full py-3 text-muted-foreground hover:bg-secondary/50 font-normal"
                >
                  Cancel
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Report Dialog */}
          <ReportContentDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            targetId={profile.id}
            targetType="user"
            viewerId={user?.id || "anonymous"}
          />

          {/* Share Profile Dialog */}
          <ShareProfileDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            username={profile.username}
            displayName={profile.display_name || profile.username}
          />
        </div>
      )}
    </AppShell>
  );
}
