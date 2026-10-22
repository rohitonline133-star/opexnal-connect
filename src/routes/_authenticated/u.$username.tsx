import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronLeft,
  Loader2,
  Lock,
  MoreHorizontal,
  Share2,
  ShieldAlert,
  UserX,
  VolumeX,
  Flag,
  Info,
  Grid3x3,
  Clapperboard,
  Tag,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { PostGrid } from "@/components/opexnal/post-grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { authClient } from "@/integrations/supabase/client";
import { getProfileByUsername, initialsFor, type Profile } from "@/lib/profile";
import { useSession } from "@/hooks/use-session";
import { openDirectConversation } from "@/lib/messages";
import { getStoredSettings, saveSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

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

type ProfileTab = "posts" | "reels" | "tagged";

function PublicProfile() {
  const { username } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  // 3-Dots Menu Dialogs
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ["profile-by-username", username],
    queryFn: () => getProfileByUsername(username),
  });

  const isSelf = Boolean(user && profile && user.id === profile.id);

  const { data: relationship } = useQuery({
    queryKey: ["relationship", user?.id, profile?.id],
    enabled: Boolean(user?.id && profile?.id) && !isSelf,
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/users/${encodeURIComponent(profile!.id)}/follow-status`,
        { headers: authClient.getAuthHeader(), cache: "no-store" },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        isFollowing?: boolean;
        requestPending?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Could not load relationship status.");
      return { following: Boolean(payload.isFollowing), requested: Boolean(payload.requestPending) };
    },
  });

  async function toggleFollow() {
    if (!user || !profile) return;
    try {
      let response: Response;
      if (relationship?.following) {
        response = await fetch(`/api/v1/users/${encodeURIComponent(profile.id)}/follow`, {
          method: "DELETE",
          headers: authClient.getAuthHeader(),
        });
      } else if (relationship?.requested) {
        response = await fetch(`/api/v1/users/${encodeURIComponent(profile.id)}/follow-request`, {
          method: "DELETE",
          headers: authClient.getAuthHeader(),
        });
      } else {
        response = await fetch(`/api/v1/users/${encodeURIComponent(profile.id)}/follow`, {
          method: "POST",
          headers: authClient.getAuthHeader(),
        });
      }
      const payload = (await response.json().catch(() => ({}))) as {
        status?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Could not update follow status.");
      if (relationship?.following) toast.success(`Unfollowed @${profile.username}`);
      else if (relationship?.requested) toast.success("Follow request withdrawn");
      else toast.success(payload.status === "requested" ? "Follow request sent" : `Following @${profile.username}`);
      await queryClient.invalidateQueries({ queryKey: ["relationship", user.id, profile.id] });
      await queryClient.invalidateQueries({ queryKey: ["profile-by-username", username] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update follow status.");
    }
  }


  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setMenuOpen(false);
    toast.success("Profile link copied to clipboard");
  };

  const handleBlockUser = async () => {
    if (!profile) return;
    try {
      const response = await fetch(`/api/v1/users/${encodeURIComponent(profile.id)}/block`, {
        method: "POST",
        headers: authClient.getAuthHeader(),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not block this account.");
      setBlockDialogOpen(false);
      setMenuOpen(false);
      toast.success(`Blocked @${username}`);
      navigate({ to: "/explore" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not block this account.");
    }
  };

  const handleRestrictUser = async () => {
    if (!profile) return;
    try {
      const response = await fetch(`/api/v1/users/${encodeURIComponent(profile.id)}/restrict`, {
        method: "POST",
        headers: authClient.getAuthHeader(),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not restrict this account.");
      setRestrictDialogOpen(false);
      setMenuOpen(false);
      toast.success(`Restricted @${username}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restrict this account.");
    }
  };

  const handleReportUser = async (reason: string) => {
    if (!profile) return;
    setReportDialogOpen(false);
    setMenuOpen(false);
    const allowedReasons = new Set([
      "spam",
      "harassment",
      "impersonation",
      "hate",
      "nudity",
      "violence",
      "scam",
      "other",
    ]);
    try {
      const response = await fetch("/api/v1/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authClient.getAuthHeader(),
        },
        body: JSON.stringify({
          targetType: "user",
          targetId: profile.id,
          reason: allowedReasons.has(reason.toLowerCase()) ? reason.toLowerCase() : "other",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Report submission failed.");
      toast.success(`Report submitted for @${username}. Thank you.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Report submission failed.");
    }
  };

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
              <ChevronLeft className="h-5 w-5" />
            </Link>
          }
          right={
            !isSelf && profile ? (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                aria-label="User actions"
              >
                <MoreHorizontal className="h-4 w-4" />
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
                className="flex-1 rounded-xl"
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
                className="flex-1 rounded-xl"
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

          {/* Grid Tabs: Posts, Reels, Tagged */}
          <div className="flex border-b border-border mt-6">
            <button
              type="button"
              onClick={() => setActiveTab("posts")}
              className={cn(
                "flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors",
                activeTab === "posts"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Grid3x3 className="h-4 w-4" />
              <span>Posts</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reels")}
              className={cn(
                "flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors",
                activeTab === "reels"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Clapperboard className="h-4 w-4" />
              <span>Reels</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tagged")}
              className={cn(
                "flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors",
                activeTab === "tagged"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Tag className="h-4 w-4" />
              <span>Tagged</span>
            </button>
          </div>

          <div>
            {profile.is_private && !relationship?.following && !isSelf ? (
              <div className="flex flex-col items-center px-8 py-20 text-center">
                <Lock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold">This account is private</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Follow this account to see their photos, reels and videos.
                </p>
              </div>
            ) : activeTab === "posts" ? (
              <PostGrid userId={profile.id} viewerId={user?.id ?? null} />
            ) : activeTab === "reels" ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Clapperboard className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p>No vertical reels shared by @{username} yet.</p>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Tag className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p>No photos or videos tagged with @{username} yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3-Dots User Action Sheet */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-3 bg-card border-border">
          <div className="divide-y divide-border text-xs">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setAboutDialogOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <Info className="h-4 w-4 text-primary" />
              <span>About this account</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span>Share profile link</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setRestrictDialogOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
            >
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Restrict @{username}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setBlockDialogOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold"
            >
              <UserX className="h-4 w-4 text-destructive" />
              <span>Block @{username}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setReportDialogOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold"
            >
              <Flag className="h-4 w-4 text-destructive" />
              <span>Report account</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Account Dialog */}
      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              About This Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-surface border border-border rounded-xl">
              <p className="text-[11px] text-muted-foreground">Username</p>
              <p className="font-semibold text-foreground">@{username}</p>
            </div>
            <div className="p-3 bg-surface border border-border rounded-xl">
              <p className="text-[11px] text-muted-foreground">Account Type</p>
              <p className="font-semibold capitalize text-foreground">
                {profile?.account_type || "personal"}
              </p>
            </div>
            <div className="p-3 bg-surface border border-border rounded-xl">
              <p className="text-[11px] text-muted-foreground">Community Standing</p>
              <p className="font-semibold text-emerald-400">Verified & Active</p>
            </div>
          </div>
          <Button
            variant="surface"
            onClick={() => setAboutDialogOpen(false)}
            className="w-full text-xs rounded-xl"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Block @{username}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              They won't be able to find your profile, posts, or stories on Opexnal. We won't notify
              them that you blocked them.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="surface"
              onClick={() => setBlockDialogOpen(false)}
              className="flex-1 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockUser}
              className="flex-1 text-xs rounded-xl font-semibold"
            >
              Block
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restrict Confirmation Dialog */}
      <Dialog open={restrictDialogOpen} onOpenChange={setRestrictDialogOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              Restrict @{username}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Only you and @{username} will be able to see their new comments on your posts. Their
              direct chats will be moved to Message Requests.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="surface"
              onClick={() => setRestrictDialogOpen(false)}
              className="flex-1 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestrictUser}
              className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
            >
              Restrict
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report User Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Report @{username}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Select why you are reporting this account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            {[
              "It's posting spam",
              "Pretending to be someone else",
              "Harassment or bullying",
              "Sharing inappropriate content",
              "Selling illegal or regulated goods",
            ].map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => handleReportUser(reason)}
                className="w-full p-2.5 text-left text-xs bg-surface border border-border rounded-xl hover:bg-secondary transition-colors"
              >
                {reason}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
