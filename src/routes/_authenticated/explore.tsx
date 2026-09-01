import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clapperboard,
  Compass,
  Flame,
  Grid3x3,
  Hash,
  Layers,
  Loader2,
  Lock,
  Play,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { useSignedMediaUrl } from "@/components/opexnal/post-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { getExploreFeed, type FeedPost } from "@/lib/posts";
import { initialsFor } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explore & Discover — Opexnal" },
      {
        name: "description",
        content:
          "Discover trending creators, viral reels, aesthetic posts and popular hashtags on Opexnal.",
      },
      { property: "og:title", content: "Explore & Discover — Opexnal" },
      {
        property: "og:description",
        content:
          "Discover trending creators, viral reels, aesthetic posts and popular hashtags on Opexnal.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

const CURATED_HASHTAGS = [
  { tag: "opexnal", posts: "12.4K", category: "Community" },
  { tag: "creatorlife", posts: "8.9K", category: "Lifestyle" },
  { tag: "aesthetics", posts: "24.1K", category: "Design" },
  { tag: "techvibes", posts: "6.2K", category: "Tech" },
  { tag: "buildinpublic", posts: "15.8K", category: "Startup" },
  { tag: "reelsindia", posts: "32.0K", category: "Video" },
  { tag: "streetphotography", posts: "18.3K", category: "Photography" },
  { tag: "minimalism", posts: "9.5K", category: "Art" },
];

function Explore() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"trending" | "people" | "reels" | "tags">("trending");

  const query = term.trim().toLowerCase();

  // Search People query
  const peopleQuery = useQuery({
    queryKey: ["search-people", query],
    enabled: query.length >= 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, is_verified, is_private, followers_count, bio",
        )
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .eq("is_deactivated", false)
        .order("followers_count", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Explore Posts Feed
  const explorePostsQuery = useQuery({
    queryKey: ["explore-feed", user?.id],
    queryFn: () => getExploreFeed(user?.id ?? null),
  });

  // Suggested Creators for Explore
  const suggestedCreatorsQuery = useQuery({
    queryKey: ["suggested-creators", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_verified, is_private, followers_count")
        .eq("is_deactivated", false)
        .order("followers_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data?.filter((p) => p.id !== user?.id) || [];
    },
  });

  const posts = explorePostsQuery.data || [];
  const reels = posts.filter((p) => p.media.some((m) => m.media_type === "video"));

  async function handleQuickFollow(targetId: string, targetUsername: string) {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc("request_follow", { _target_id: targetId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(data === "requested" ? "Follow request sent" : `Following @${targetUsername}`);
      queryClient.invalidateQueries({ queryKey: ["suggested-creators"] });
      queryClient.invalidateQueries({ queryKey: ["search-people"] });
    } catch {
      toast.error("Could not complete follow action");
    }
  }

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Explore"
          right={
            <Link
              to="/ai"
              aria-label="Opexnal AI Studio"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              AI Studio
            </Link>
          }
        />
      }
    >
      <div className="px-3 sm:px-4 py-3 space-y-3.5 max-w-lg mx-auto">
        {/* Search Input Bar */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search creators, hashtags, keywords..."
            aria-label="Search Opexnal"
            maxLength={60}
            className="h-11 rounded-2xl bg-surface pl-10 pr-9 text-xs sm:text-sm placeholder:text-muted-foreground"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Discovery Filter Tabs */}
        {!query && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "trending", label: "Trending", icon: Flame },
              { id: "people", label: "Creators", icon: Users },
              { id: "reels", label: "Reels", icon: Clapperboard },
              { id: "tags", label: "Hashtags", icon: Hash },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border",
                    active
                      ? "brand-gradient-bg text-primary-foreground border-primary shadow-xs"
                      : "bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* SEARCH RESULTS VIEW */}
        {query.length >= 1 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Search Results for "{query}"
              </h2>
              {peopleQuery.isFetching && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              )}
            </div>

            {/* Direct hashtag shortcut */}
            <Link
              to="/tag/$tag"
              params={{ tag: query.replace(/^#/, "") }}
              className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl brand-gradient-bg text-primary-foreground">
                <Hash className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground">#{query.replace(/^#/, "")}</p>
                <p className="text-xs text-muted-foreground">
                  Explore posts tagged #{query.replace(/^#/, "")}
                </p>
              </div>
            </Link>

            {/* People search results */}
            <div className="space-y-1">
              {peopleQuery.data?.length === 0 && (
                <p className="py-12 text-center text-xs text-muted-foreground">
                  No accounts found matching "{query}".
                </p>
              )}

              {peopleQuery.data?.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/60"
                >
                  <Link
                    to="/u/$username"
                    params={{ username: person.username }}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <ProfileAvatar
                      path={person.avatar_url}
                      fallback={initialsFor(person)}
                      className="h-11 w-11"
                    />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate text-sm font-semibold">
                        @{person.username}
                        {person.is_verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-label="Verified" />
                        )}
                        {person.is_private && (
                          <Lock className="h-3 w-3 text-muted-foreground" aria-label="Private" />
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {person.display_name || "Opexnal member"}
                        {person.followers_count > 0 && ` • ${person.followers_count} followers`}
                      </p>
                    </div>
                  </Link>

                  {user && user.id !== person.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickFollow(person.id, person.username)}
                      className="h-8 rounded-lg text-xs font-semibold hover:border-primary hover:text-primary"
                    >
                      <UserPlus className="mr-1 h-3.5 w-3.5" />
                      Follow
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* TABBED EXPLORE CONTENT */
          <>
            {/* 1. TRENDING TAB */}
            {activeTab === "trending" && (
              <div className="space-y-5">
                {/* Featured Creators Carousel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Suggested Creators
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("people")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      See All
                    </button>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                    {suggestedCreatorsQuery.data?.slice(0, 6).map((creator) => (
                      <div
                        key={creator.id}
                        className="flex w-32 shrink-0 flex-col items-center rounded-2xl border border-border bg-surface p-3 text-center shadow-xs"
                      >
                        <Link to="/u/$username" params={{ username: creator.username }}>
                          <ProfileAvatar
                            path={creator.avatar_url}
                            fallback={initialsFor(creator)}
                            className="h-12 w-12 text-sm ring-2 ring-primary/20"
                          />
                        </Link>
                        <p className="mt-2 truncate w-full text-xs font-semibold flex items-center justify-center gap-0.5">
                          @{creator.username}
                          {creator.is_verified && (
                            <BadgeCheck className="h-3 w-3 text-primary shrink-0" />
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate w-full">
                          {creator.followers_count} followers
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleQuickFollow(creator.id, creator.username)}
                          className="mt-2.5 h-7 w-full rounded-lg text-[11px] font-semibold brand-gradient-bg text-primary-foreground"
                        >
                          Follow
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending Hashtags Badges */}
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> Trending Topics
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {CURATED_HASHTAGS.slice(0, 6).map((h) => (
                      <Link
                        key={h.tag}
                        to="/tag/$tag"
                        params={{ tag: h.tag }}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface p-2.5 transition-colors hover:border-primary/40 hover:bg-secondary/50"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">#{h.tag}</p>
                          <p className="text-[10px] text-muted-foreground">{h.category}</p>
                        </div>
                        <span className="text-[10px] font-medium text-primary shrink-0">
                          {h.posts}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Explore Media Grid */}
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Grid3x3 className="h-3.5 w-3.5 text-primary" /> Explore Community
                  </h2>

                  {explorePostsQuery.isLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                      <Compass className="mx-auto h-8 w-8 text-muted-foreground/60" />
                      <p className="mt-2 text-xs font-semibold text-foreground">
                        No posts shared yet
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Be the first to share a post!
                      </p>
                      <Button
                        asChild
                        size="sm"
                        className="mt-3 brand-gradient-bg text-primary-foreground text-xs"
                      >
                        <Link to="/create">Create First Post</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                      {posts.map((post) => (
                        <ExploreGridItem key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. CREATORS TAB */}
            {activeTab === "people" && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Featured Creators
                </h2>
                <div className="space-y-1">
                  {suggestedCreatorsQuery.data?.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:bg-secondary/40"
                    >
                      <Link
                        to="/u/$username"
                        params={{ username: creator.username }}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <ProfileAvatar
                          path={creator.avatar_url}
                          fallback={initialsFor(creator)}
                          className="h-12 w-12 text-sm"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate text-sm font-semibold">
                            @{creator.username}
                            {creator.is_verified && (
                              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {creator.display_name || "Opexnal creator"}
                          </p>
                          <p className="text-[10px] text-primary font-medium">
                            {creator.followers_count} followers
                          </p>
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleQuickFollow(creator.id, creator.username)}
                        className="h-8 text-xs font-semibold brand-gradient-bg text-primary-foreground"
                      >
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. REELS TAB */}
            {activeTab === "reels" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clapperboard className="h-3.5 w-3.5 text-primary" /> Trending Reels
                  </h2>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-primary">
                    <Link to="/reels">Full Screen Player</Link>
                  </Button>
                </div>

                {reels.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                    <Clapperboard className="mx-auto h-8 w-8 text-muted-foreground/60" />
                    <p className="mt-2 text-xs font-semibold">No video reels yet</p>
                    <p className="text-[11px] text-muted-foreground">
                      Upload a video in Create Post
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-3 brand-gradient-bg text-primary-foreground text-xs"
                    >
                      <Link to="/create">Upload Reel</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {reels.map((reel) => (
                      <Link
                        key={reel.id}
                        to="/p/$postId"
                        params={{ postId: reel.id }}
                        className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-black border border-border shadow-xs"
                      >
                        <ExploreVideoThumb post={reel} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                          <p className="text-xs font-semibold text-white truncate">
                            @{reel.author?.username}
                          </p>
                          <p className="text-[10px] text-white/80 line-clamp-1">
                            {reel.caption || "Opexnal Reel"}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-white/70 mt-0.5">
                            <Play className="h-2.5 w-2.5 fill-white text-white" />
                            <span>{reel.likes_count} likes</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. HASHTAGS TAB */}
            {activeTab === "tags" && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Popular Hashtags
                </h2>
                <div className="space-y-1.5">
                  {CURATED_HASHTAGS.map((h) => (
                    <Link
                      key={h.tag}
                      to="/tag/$tag"
                      params={{ tag: h.tag }}
                      className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-secondary"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Hash className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">#{h.tag}</p>
                          <p className="text-[10px] text-muted-foreground">{h.category} Category</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary">{h.posts} posts</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function ExploreGridItem({ post }: { post: FeedPost }) {
  const primary = post.media[0];
  const url = useSignedMediaUrl(primary?.storage_path);
  const isVideo = primary?.media_type === "video";
  const isCarousel = post.media.length > 1;

  return (
    <Link
      to="/p/$postId"
      params={{ postId: post.id }}
      className="group relative aspect-square overflow-hidden bg-secondary transition-opacity hover:opacity-90"
    >
      {url ? (
        isVideo ? (
          <video src={url} className="h-full w-full object-cover" muted playsInline />
        ) : (
          <img
            src={url}
            alt={post.caption || "Explore post"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-secondary" />
      )}

      {isVideo && (
        <div className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white backdrop-blur">
          <Play className="h-3 w-3 fill-white" />
        </div>
      )}

      {isCarousel && (
        <div className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white backdrop-blur">
          <Layers className="h-3 w-3" />
        </div>
      )}
    </Link>
  );
}

function ExploreVideoThumb({ post }: { post: FeedPost }) {
  const video = post.media.find((m) => m.media_type === "video");
  const url = useSignedMediaUrl(video?.storage_path);

  if (!url) return <div className="h-full w-full bg-secondary animate-pulse" />;
  return <video src={url} className="h-full w-full object-cover" muted playsInline />;
}
