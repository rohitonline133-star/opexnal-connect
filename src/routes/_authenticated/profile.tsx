import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Grid3x3,
  Loader2,
  Settings,
  BadgeCheck,
  Lock,
  Clapperboard,
  Bookmark,
  Tag,
  Share2,
  BarChart3,
  Archive,
  Users,
  Search,
  UserX,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { PostGrid } from "@/components/opexnal/post-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProfileById, initialsFor, type Profile } from "@/lib/profile";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Opexnal" },
      { name: "description", content: "Your Opexnal profile, stats and posts." },
      { property: "og:title", content: "Your profile — Opexnal" },
      { property: "og:description", content: "Your Opexnal profile, stats and posts." },
      { property: "og:type", content: "profile" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyProfile,
});

type ProfileTab = "posts" | "reels" | "saved" | "tagged";

function MyProfile() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  // Followers/Following Dialog
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [followSearch, setFollowSearch] = useState("");

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ["profile", user?.id],
    queryFn: () => (user?.id ? getProfileById(user.id) : null),
    enabled: Boolean(user?.id),
  });

  const handleShareProfile = () => {
    const url = `${window.location.origin}/u/${profile?.username || ""}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied to clipboard");
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={profile ? `@${profile.username}` : "Profile"}
          right={
            <div className="flex items-center gap-1">
              <Link
                to="/archive"
                aria-label="Archive"
                className="text-muted-foreground hover:text-foreground h-9 w-9 flex items-center justify-center rounded-xl hover:bg-surface"
              >
                <Archive className="h-5 w-5" />
              </Link>
              <Link
                to="/settings"
                aria-label="Settings"
                className="text-muted-foreground hover:text-foreground h-9 w-9 flex items-center justify-center rounded-xl hover:bg-surface"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          }
        />
      }
    >
      {isLoading || !profile ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <div>
          {/* Avatar and Stats */}
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
              <div
                onClick={() => setFollowModal("followers")}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <dt className="text-xs text-muted-foreground">Followers</dt>
                <dd className="stat-num text-lg font-semibold">{profile.followers_count}</dd>
              </div>
              <div
                onClick={() => setFollowModal("following")}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <dt className="text-xs text-muted-foreground">Following</dt>
                <dd className="text-lg font-semibold">{profile.following_count}</dd>
              </div>
            </dl>
          </div>

          {/* User Bio Details */}
          <div className="px-4 pt-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              {profile.display_name || profile.username}
              {profile.is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified" />
              )}
              {profile.is_private && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Private account" />
              )}
            </p>
            <p className="text-xs capitalize text-muted-foreground">
              {profile.account_type} account
            </p>
            {profile.bio && <p className="mt-2 whitespace-pre-line text-sm">{profile.bio}</p>}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div id="action-buttons" className="flex gap-2 px-4 pt-4">
            <Button asChild variant="surface" className="flex-1 rounded-xl text-xs h-9">
              <Link to="/profile/edit">Edit profile</Link>
            </Button>
            <Button
              type="button"
              variant="surface"
              onClick={handleShareProfile}
              className="flex-1 rounded-xl text-xs h-9"
            >
              Share profile
            </Button>
            <Button asChild variant="surface" className="flex-1 rounded-xl text-xs h-9">
              <Link to="/creator">Dashboard</Link>
            </Button>
          </div>

          {/* Grid Tabs: Posts, Reels, Saved, Tagged */}
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
              onClick={() => setActiveTab("saved")}
              className={cn(
                "flex-1 flex justify-center items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors",
                activeTab === "saved"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Bookmark className="h-4 w-4" />
              <span>Saved</span>
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
            {activeTab === "posts" ? (
              <PostGrid
                userId={profile.id}
                viewerId={user?.id ?? null}
                emptyMessage="You haven't posted yet. Tap create to share your first photo or video."
              />
            ) : activeTab === "reels" ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Clapperboard className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p>You haven't uploaded any video reels yet.</p>
                <Button
                  asChild
                  size="sm"
                  className="brand-gradient-bg text-white rounded-xl text-xs"
                >
                  <Link to="/create">Upload Reel</Link>
                </Button>
              </div>
            ) : activeTab === "saved" ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p>Only you can see posts you have bookmarked.</p>
                <Button asChild size="sm" variant="surface" className="rounded-xl text-xs">
                  <Link to="/explore">Explore Content</Link>
                </Button>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Tag className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p>When people tag you in photos or reels, they will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Followers & Following Modal */}
      <Dialog open={Boolean(followModal)} onOpenChange={() => setFollowModal(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold capitalize flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {followModal === "followers" ? "Followers" : "Following"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={followSearch}
                onChange={(e) => setFollowSearch(e.target.value)}
                className="pl-8 h-8 rounded-xl bg-surface border-border text-xs"
              />
            </div>

            <div className="divide-y divide-border max-h-56 overflow-y-auto text-xs">
              {[
                { username: "maya_visuals", name: "Maya Sharma" },
                { username: "aarav_tech", name: "Aarav Patel" },
                { username: "sneha_art", name: "Sneha Roy" },
              ]
                .filter((p) => p.username.includes(followSearch) || p.name.includes(followSearch))
                .map((person) => (
                  <div key={person.username} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">@{person.username}</p>
                      <p className="text-[11px] text-muted-foreground">{person.name}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="surface"
                      onClick={() =>
                        toast.success(
                          followModal === "followers"
                            ? `Removed @${person.username}`
                            : `Unfollowed @${person.username}`,
                        )
                      }
                      className="h-7 text-[11px] px-2 rounded-lg"
                    >
                      {followModal === "followers" ? "Remove" : "Following"}
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
