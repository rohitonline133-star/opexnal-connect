import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bookmark,
  Clapperboard,
  Grid3x3,
  Loader2,
  Lock,
  Plus,
  QrCode,
  Settings,
  Share2,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { PostGrid } from "@/components/opexnal/post-grid";
import { ShareProfileDialog } from "@/components/opexnal/share-profile-dialog";
import { Button } from "@/components/ui/button";
import { getProfileById, initialsFor } from "@/lib/profile";
import { getStoryHighlights, type StoryHighlight } from "@/lib/stories";
import { getSavedPosts, getUserPostsPage } from "@/lib/posts";
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

function MyProfile() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved">("posts");
  const [shareOpen, setShareOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfileById(user!.id),
    enabled: Boolean(user?.id),
  });

  const { data: highlights } = useQuery({
    queryKey: ["story-highlights", user?.id],
    queryFn: () => (user?.id ? getStoryHighlights(user.id) : []),
    enabled: Boolean(user?.id),
  });

  const { data: savedPosts } = useQuery({
    queryKey: ["saved-posts", user?.id],
    queryFn: () => (user?.id ? getSavedPosts(user.id) : []),
    enabled: Boolean(user?.id && activeTab === "saved"),
  });

  return (
    <AppShell
      header={
        <ScreenHeader
          title={profile ? `@${profile.username}` : "Profile"}
          right={
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Share profile"
                onClick={() => setShareOpen(true)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full"
              >
                <QrCode className="h-5 w-5" />
              </button>
              <Link
                to="/settings"
                aria-label="Settings"
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full"
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
                <dd className="stat-num text-lg font-semibold">{profile.followers_count}</dd>
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

          <div id="action-buttons" className="action-buttons flex gap-2 px-4 pt-4">
            <Button
              asChild
              variant="brand"
              id="btn-follow"
              className="btn-pop flex-1 rounded-xl active:scale-90 duration-200"
              onClick={() => toast.success("Discover creators to follow on Explore")}
            >
              <Link to="/explore">Follow</Link>
            </Button>
            <Button asChild variant="surface" id="btn-message" className="flex-1 rounded-xl">
              <Link to="/messages">Message</Link>
            </Button>
            <Button asChild variant="surface" className="flex-1 rounded-xl">
              <Link to="/profile/edit">Edit profile</Link>
            </Button>
            <Button
              variant="surface"
              className="flex-1 rounded-xl"
              onClick={() => setShareOpen(true)}
            >
              Share profile
            </Button>
          </div>

          {/* Story Highlights Tray */}
          <div className="mt-5 px-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
              <Link to="/stories/new" className="flex flex-col items-center gap-1.5 shrink-0 group">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary/50 text-muted-foreground group-hover:border-primary group-hover:text-foreground transition-colors">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">New</span>
              </Link>

              {(highlights ?? []).map((hl: StoryHighlight) => (
                <Link
                  key={hl.id}
                  to="/stories/$userId"
                  params={{ userId: user!.id }}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-primary/40 p-0.5 group-hover:ring-primary transition-all">
                    <img
                      src={hl.coverUrl}
                      alt={hl.title}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <span className="max-w-[70px] truncate text-[11px] font-medium text-foreground">
                    {hl.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile Content Tabs */}
          <div className="mt-4 border-t border-border">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab("posts")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
                  activeTab === "posts"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Grid3x3 className="h-4 w-4" aria-hidden="true" /> Posts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reels")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
                  activeTab === "reels"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Clapperboard className="h-4 w-4" aria-hidden="true" /> Reels
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
                  activeTab === "saved"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" /> Saved
              </button>
            </div>

            {activeTab === "posts" && (
              <PostGrid
                userId={profile.id}
                viewerId={user?.id ?? null}
                emptyMessage="You haven't posted yet. Tap create to share your first photo or video."
              />
            )}

            {activeTab === "reels" && (
              <PostGrid
                userId={profile.id}
                viewerId={user?.id ?? null}
                emptyMessage="No reels shared yet. Create a video reel to showcase here."
              />
            )}

            {activeTab === "saved" && (
              <div className="p-1">
                {(savedPosts ?? []).length === 0 ? (
                  <p className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No saved posts yet. Tap the bookmark icon on any post to save it.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {(savedPosts ?? []).map((post) => (
                      <Link
                        key={post.id}
                        to="/p/$postId"
                        params={{ postId: post.id }}
                        className="relative aspect-square overflow-hidden bg-secondary"
                      >
                        {post.media[0] && (
                          <img
                            src={post.media[0].storage_path}
                            alt={post.caption || "Saved post"}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share Profile Modal */}
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
