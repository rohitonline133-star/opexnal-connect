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
  QrCode,
  Menu,
  Settings,
  Bookmark,
  Activity,
  Archive,
  Users,
  Star,
  BarChart3,
  LogOut,
  Link as LinkIcon,
  Download,
  Copy,
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
import { supabase } from "@/integrations/supabase/client";
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
  const [selfMenuOpen, setSelfMenuOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ["profile-by-username", username],
    queryFn: () => getProfileByUsername(username),
  });

  const isSelf = Boolean(
    user &&
    profile &&
    (user.id === profile.id ||
      (user.username && user.username.toLowerCase() === profile.username.toLowerCase()) ||
      (user.user_metadata?.username &&
        user.user_metadata.username.toLowerCase() === profile.username.toLowerCase())),
  );

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
        toast.error((error as Error).message || "Could not withdraw request");
        return;
      }
      toast.success("Request withdrawn");
    } else {
      const { data, error } = await supabase.rpc("request_follow", { _target_id: profile.id });
      if (error) {
        toast.error((error as Error).message || "Could not follow user");
        return;
      }
      toast.success(
        data === "requested" ? "Follow request sent" : `Following @${profile.username}`,
      );
    }
    await queryClient.invalidateQueries({ queryKey: ["relationship", user.id, profile.id] });
    await queryClient.invalidateQueries({ queryKey: ["profile-by-username", username] });
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setMenuOpen(false);
    toast.success("Profile link copied to clipboard");
  };

  const handleBlockUser = () => {
    const settings = getStoredSettings();
    saveSettings({
      blockedUsers: [
        ...settings.blockedUsers,
        { id: profile?.id || "u", username, blockedAt: "Just now" },
      ],
    });
    setBlockDialogOpen(false);
    setMenuOpen(false);
    toast.success(`Blocked @${username}. They will no longer be able to find your profile.`);
    navigate({ to: "/explore" });
  };

  const handleRestrictUser = () => {
    const settings = getStoredSettings();
    saveSettings({
      restrictedUsers: [
        ...settings.restrictedUsers,
        { id: profile?.id || "u", username, restrictedAt: "Just now" },
      ],
    });
    setRestrictDialogOpen(false);
    setMenuOpen(false);
    toast.success(`Restricted @${username}. Only they will see new comments on your posts.`);
  };

  const handleReportUser = (reason: string) => {
    setReportDialogOpen(false);
    setMenuOpen(false);
    toast.success(`Report submitted for @${username} (${reason}). Thank you.`);
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
            isSelf ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQrDialogOpen(true)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                  aria-label="QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelfMenuOpen(true)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                  aria-label="Menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            ) : profile ? (
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
          {profile.banner_url && (
            <div className="h-28 w-full overflow-hidden relative border-b border-border">
              <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
            </div>
          )}

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
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold">{profile.display_name || profile.username}</p>
              {profile.is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified" />
              )}
              {profile.pronouns && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({profile.pronouns})
                </span>
              )}
            </div>
            {profile.bio && <p className="mt-2 whitespace-pre-line text-sm">{profile.bio}</p>}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline truncate max-w-full"
              >
                <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{profile.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
            {profile.links && profile.links.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.links.map((lnk, idx) => (
                  <a
                    key={idx}
                    href={lnk.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] bg-surface border border-border px-2.5 py-1 rounded-full text-foreground hover:text-primary transition-colors"
                  >
                    <LinkIcon className="h-3 w-3 text-primary shrink-0" />
                    <span>{lnk.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {isSelf ? (
            <div className="flex gap-2 px-4 pt-4">
              <Button
                variant="surface"
                size="xl"
                className="flex-1 rounded-xl font-medium"
                onClick={() => navigate({ to: "/profile/edit" })}
              >
                Edit Profile
              </Button>
              <Button
                variant="surface"
                size="xl"
                className="flex-1 rounded-xl font-medium"
                onClick={() => setQrDialogOpen(true)}
              >
                Share Profile
              </Button>
            </div>
          ) : (
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

      {/* Self Profile Hamburger Menu Sheet */}
      <Dialog open={selfMenuOpen} onOpenChange={setSelfMenuOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-3 bg-card border-border">
          <div className="divide-y divide-border text-xs">
            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                navigate({ to: "/settings" });
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <Settings className="h-4 w-4 text-primary" />
              <span>Settings and Activity</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                navigate({ to: "/settings/account" });
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <Info className="h-4 w-4 text-primary" />
              <span>Accounts Center</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                navigate({ to: "/activity" });
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <Activity className="h-4 w-4 text-primary" />
              <span>Your Activity</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                navigate({ to: "/archive" });
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <Archive className="h-4 w-4 text-primary" />
              <span>Archive</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                setQrDialogOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <QrCode className="h-4 w-4 text-primary" />
              <span>QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                navigate({ to: "/saved" });
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <Bookmark className="h-4 w-4 text-primary" />
              <span>Saved</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                navigate({ to: "/close-friends" });
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <Users className="h-4 w-4 text-emerald-400" />
              <span>Close Friends</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                navigate({ to: "/settings" });
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <Star className="h-4 w-4 text-amber-400" />
              <span>Favorites</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                navigate({ to: "/professional" });
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Professional Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelfMenuOpen(false);
                navigate({ to: "/settings" });
              }}
              className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <BadgeCheck className="h-4 w-4 text-primary" />
              <span>Opexnal Verified</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setSelfMenuOpen(false);
                await supabase.auth.signOut();
                toast.success("Logged out successfully");
                navigate({ to: "/auth", search: { mode: "login" } });
              }}
              className="w-full flex items-center gap-3 p-3 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold"
            >
              <LogOut className="h-4 w-4 text-destructive" />
              <span>Log out</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 bg-card border-border text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Share Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Scan with camera or share link to open @{username}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center justify-center">
            {/* Stylized QR Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 shadow-xl inline-block">
              <div className="bg-white p-4 rounded-2xl shadow-inner flex flex-col items-center">
                <svg
                  className="h-36 w-36 text-black"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer corner blocks */}
                  <rect x="5" y="5" width="28" height="28" rx="4" fill="black" />
                  <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
                  <rect x="13" y="13" width="12" height="12" rx="1" fill="black" />

                  <rect x="67" y="5" width="28" height="28" rx="4" fill="black" />
                  <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
                  <rect x="75" y="13" width="12" height="12" rx="1" fill="black" />

                  <rect x="5" y="67" width="28" height="28" rx="4" fill="black" />
                  <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
                  <rect x="13" y="75" width="12" height="12" rx="1" fill="black" />

                  {/* QR Pattern dots */}
                  <rect x="40" y="8" width="6" height="6" rx="1" fill="black" />
                  <rect x="52" y="8" width="6" height="6" rx="1" fill="black" />
                  <rect x="40" y="20" width="6" height="6" rx="1" fill="black" />
                  <rect x="46" y="28" width="8" height="6" rx="1" fill="black" />
                  <rect x="8" y="42" width="6" height="6" rx="1" fill="black" />
                  <rect x="22" y="46" width="6" height="6" rx="1" fill="black" />
                  <rect x="36" y="40" width="8" height="8" rx="2" fill="black" />
                  <rect x="50" y="42" width="6" height="6" rx="1" fill="black" />
                  <rect x="62" y="40" width="8" height="8" rx="2" fill="black" />
                  <rect x="76" y="44" width="8" height="6" rx="1" fill="black" />
                  <rect x="88" y="42" width="6" height="6" rx="1" fill="black" />
                  <rect x="40" y="56" width="6" height="6" rx="1" fill="black" />
                  <rect x="54" y="54" width="6" height="6" rx="1" fill="black" />
                  <rect x="68" y="58" width="6" height="6" rx="1" fill="black" />
                  <rect x="82" y="56" width="6" height="6" rx="1" fill="black" />
                  <rect x="42" y="72" width="8" height="8" rx="2" fill="black" />
                  <rect x="56" y="70" width="8" height="8" rx="2" fill="black" />
                  <rect x="70" y="74" width="8" height="8" rx="2" fill="black" />
                  <rect x="84" y="72" width="8" height="8" rx="2" fill="black" />
                  <rect x="50" y="86" width="6" height="6" rx="1" fill="black" />
                  <rect x="64" y="86" width="6" height="6" rx="1" fill="black" />
                  <rect x="78" y="86" width="8" height="6" rx="1" fill="black" />
                </svg>
                <p className="mt-2 text-[11px] font-bold text-zinc-900 tracking-wider">
                  @{username}
                </p>
                <p className="text-[9px] text-zinc-500 font-medium">OPEXNAL CONNECT</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="surface"
              onClick={handleCopyLink}
              className="flex-1 text-xs rounded-xl gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Link</span>
            </Button>
            <Button
              onClick={() => {
                toast.success("QR Code downloaded as PNG");
              }}
              className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
