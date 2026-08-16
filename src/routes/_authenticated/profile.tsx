import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Grid3x3, Loader2, Settings, BadgeCheck, Lock } from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { PostGrid } from "@/components/opexnal/post-grid";

import { Button } from "@/components/ui/button";
import { getProfileById, initialsFor } from "@/lib/profile";
import { useSession } from "@/hooks/use-session";

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
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfileById(user!.id),
    enabled: Boolean(user?.id),
  });

  return (
    <AppShell
      header={
        <ScreenHeader
          title={profile ? `@${profile.username}` : "Profile"}
          right={
            <Link
              to="/settings"
              aria-label="Settings"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </Link>
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
              {profile.is_private && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Private account" />
              )}
            </p>
            <p className="text-xs capitalize text-muted-foreground">{profile.account_type} account</p>
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

          <div className="flex gap-2 px-4 pt-4">
            <Button asChild variant="surface" className="flex-1 rounded-xl">
              <Link to="/profile/edit">Edit profile</Link>
            </Button>
            <Button asChild variant="surface" className="flex-1 rounded-xl">
              <Link to="/settings/privacy">Privacy</Link>
            </Button>
          </div>

          <div className="mt-6 border-t border-border">
            <div className="flex items-center justify-center gap-2 border-b-2 border-foreground py-3 text-sm font-medium">
              <Grid3x3 className="h-4 w-4" aria-hidden="true" /> Posts
            </div>
            <PostGrid
              userId={profile.id}
              viewerId={user?.id ?? null}
              emptyMessage="You haven't posted yet. Tap create to share your first photo or video."
            />
          </div>

        </div>
      )}
    </AppShell>
  );
}
