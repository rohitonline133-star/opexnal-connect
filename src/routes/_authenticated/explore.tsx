import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clapperboard,
  Compass,
  Flame,
  Grid3x3,
  Hash,
  History,
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
  MapPin,
  Music,
  Clock,
  ChevronRight,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { useSignedMediaUrl } from "@/hooks/use-signed-media-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { apiUrl } from "@/lib/api-client";
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
          "Discover trending creators, viral reels, aesthetic posts, audio and popular places on Opexnal.",
      },
      { property: "og:title", content: "Explore & Discover — Opexnal" },
      {
        property: "og:description",
        content:
          "Discover trending creators, viral reels, aesthetic posts, audio and popular places on Opexnal.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

interface ExploreProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_private: boolean;
  followers_count: number;
  bio?: string | null;
}

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

const CURATED_AUDIO = [
  { id: "a1", title: "Aesthetic Lo-Fi Beats", artist: "Opexnal Sound Lab", reelsCount: "42.8K" },
  { id: "a2", title: "Chill Synthwave Sunset", artist: "Retro Vibes", reelsCount: "19.3K" },
  { id: "a3", title: "Golden Hour Acoustic", artist: "Priya Roy", reelsCount: "8.6K" },
  { id: "a4", title: "Cyber City Ambient", artist: "Tech Collective", reelsCount: "14.1K" },
];

const CURATED_PLACES = [
  { id: "p1", name: "Bandra Bandstand", city: "Mumbai, India", postsCount: "34.5K" },
  { id: "p2", name: "Indiranagar 100ft Road", city: "Bengaluru, India", postsCount: "28.1K" },
  { id: "p3", name: "Connaught Place", city: "New Delhi, India", postsCount: "52.4K" },
  { id: "p4", name: "Dumbo Brooklyn", city: "New York, USA", postsCount: "120.8K" },
];

function Explore() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "trending" | "people" | "reels" | "tags" | "audio" | "places"
  >("trending");

  // Modals for Detail Views
  const [selectedAudio, setSelectedAudio] = useState<(typeof CURATED_AUDIO)[0] | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<(typeof CURATED_PLACES)[0] | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([
    "maya_codes",
    "aesthetics",
    "creatorlife",
    "reelsindia",
  ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("opexnal_recent_searches");
      if (raw) {
        setRecentSearches(JSON.parse(raw));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveSearchTerm = (termToSave: string) => {
    const clean = termToSave.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        8,
      );
      try {
        localStorage.setItem("opexnal_recent_searches", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("opexnal_recent_searches");
    } catch {
      // ignore
    }
  };

  const query = term.trim().toLowerCase();

  // Search People query
  const peopleQuery = useQuery<ExploreProfile[]>({
    queryKey: ["search-people", query],
    enabled: query.length >= 1,
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/users/search?q=${encodeURIComponent(query)}&limit=20`,
        {
          headers: authClient.getAuthHeader(),
          cache: "no-store",
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        profiles?: ExploreProfile[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "People search failed.");
      return payload.profiles || [];
    },
  });

  // Explore Posts Feed
  const explorePostsQuery = useQuery({
    queryKey: ["explore-feed", user?.id],
    queryFn: () => getExploreFeed(user?.id ?? null),
  });

  // Suggested Creators for Explore
  const suggestedCreatorsQuery = useQuery<ExploreProfile[]>({
    queryKey: ["suggested-creators", user?.id],
    queryFn: async () => {
      const response = await fetch(apiUrl("/api/v1/users/search?limit=10"), {
        headers: authClient.getAuthHeader(),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        profiles?: ExploreProfile[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Suggested creators could not be loaded.");
      return (payload.profiles || []).filter((profile) => profile.id !== user?.id);
    },
  });

  const posts = explorePostsQuery.data || [];
  const reels = posts.filter((p) => p.media.some((m) => m.media_type === "video"));

  async function handleQuickFollow(targetId: string, targetUsername: string) {
    if (!user) return;
    try {
      const response = await fetch(apiUrl(`/api/v1/users/${encodeURIComponent(targetId)}/follow`), {
        method: "POST",
        headers: authClient.getAuthHeader(),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        status?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Follow failed.");
      toast.success(payload.status === "requested" ? "Follow request sent" : `Following @${targetUsername}`);
      await queryClient.invalidateQueries({ queryKey: ["suggested-creators"] });
      await queryClient.invalidateQueries({ queryKey: ["search-people"] });
    } catch {
      toast.error("Could not complete follow action");
    }
  }

  const handleSelectRecentSearch = (item: string) => {
    setTerm(item);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    toast.success("Recent searches cleared");
  };

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
            placeholder="Search creators, hashtags, audio, places..."
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

        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Recent Searches
              </span>
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-primary hover:underline text-[11px] font-medium"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTerm(s)}
                  className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-foreground hover:bg-secondary hover:border-primary/40 transition-colors"
                >
                  {s.startsWith("#") ? s : `@${s}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Discovery Filter Tabs */}
        {!query && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {[
              { id: "trending", label: "Top", icon: Flame },
              { id: "people", label: "Accounts", icon: Users },
              { id: "reels", label: "Reels", icon: Clapperboard },
              { id: "audio", label: "Audio", icon: Music },
              { id: "tags", label: "Hashtags", icon: Hash },
              { id: "places", label: "Places", icon: MapPin },
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

        {/* RECENT SEARCHES (When input focused but empty) */}
        {!query && recentSearches.length > 0 && activeTab === "trending" && (
          <div className="p-3 bg-card border border-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Recent Searches
              </span>
              <button
                type="button"
                onClick={handleClearRecentSearches}
                className="text-[11px] text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  onClick={() => handleSelectRecentSearch(item)}
                  className="cursor-pointer text-[11px] py-1 px-2.5 hover:bg-secondary flex items-center gap-1"
                >
                  <span>{item}</span>
                  <X
                    className="h-3 w-3 text-muted-foreground hover:text-foreground ml-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecentSearches((prev) => prev.filter((x) => x !== item));
                    }}
                  />
                </Badge>
              ))}
            </div>
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
              onClick={() => saveSearchTerm(`#${query.replace(/^#/, "")}`)}
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
                    onClick={() => saveSearchTerm(person.username)}
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
            {/* 1. TOP / TRENDING TAB */}
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

                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
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

                {/* Explore Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Grid3x3 className="h-3.5 w-3.5 text-primary" /> Discover Posts
                    </h2>
                  </div>

                  {explorePostsQuery.isLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      No explore posts yet. Be the first to publish!
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-0.5 rounded-2xl overflow-hidden">
                      {posts.map((post) => (
                        <ExploreGridItem key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. CREATORS / ACCOUNTS TAB */}
            {activeTab === "people" && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Suggested Accounts
                </h2>
                <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
                  {suggestedCreatorsQuery.data?.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-3 transition-colors hover:bg-secondary/40"
                    >
                      <Link
                        to="/u/$username"
                        params={{ username: person.username }}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <ProfileAvatar
                          path={person.avatar_url}
                          fallback={initialsFor(person)}
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate text-xs font-semibold text-foreground">
                            @{person.username}
                            {person.is_verified && (
                              <BadgeCheck className="h-3 w-3 text-primary" aria-label="Verified" />
                            )}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {person.followers_count} followers
                          </p>
                        </div>
                      </Link>

                      <Button
                        size="sm"
                        onClick={() => handleQuickFollow(person.id, person.username)}
                        className="h-7 rounded-lg text-xs font-semibold brand-gradient-bg text-primary-foreground"
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
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trending Reels
                </h2>
                {reels.length === 0 ? (
                  <div className="py-16 text-center text-xs text-muted-foreground">
                    No vertical video reels available. Tap &ldquo;Create&rdquo; to share one!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {reels.map((reel) => (
                      <Link
                        key={reel.id}
                        to="/p/$postId"
                        params={{ postId: reel.id }}
                        className="group relative aspect-9/16 overflow-hidden rounded-2xl bg-zinc-900 shadow-xs"
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

            {/* 4. AUDIO TAB */}
            {activeTab === "audio" && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trending Audio & Music
                </h2>
                <div className="space-y-2">
                  {CURATED_AUDIO.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAudio(a)}
                      className="p-3.5 bg-card border border-border rounded-2xl flex items-center justify-between hover:bg-surface cursor-pointer shadow-xs transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl brand-gradient-bg flex items-center justify-center text-white">
                          <Music className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{a.title}</p>
                          <p className="text-[11px] text-muted-foreground">{a.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {a.reelsCount} reels
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. HASHTAGS TAB */}
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

            {/* 6. PLACES TAB */}
            {activeTab === "places" && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trending Places & Locations
                </h2>
                <div className="space-y-2">
                  {CURATED_PLACES.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlace(p)}
                      className="p-3.5 bg-card border border-border rounded-2xl flex items-center justify-between hover:bg-surface cursor-pointer shadow-xs transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {p.postsCount} posts
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Audio Detail Modal */}
      <Dialog open={Boolean(selectedAudio)} onOpenChange={() => setSelectedAudio(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              {selectedAudio?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              By {selectedAudio?.artist} • {selectedAudio?.reelsCount} reels created with this audio
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-3">
            <Button
              variant="surface"
              onClick={() => setSelectedAudio(null)}
              className="flex-1 text-xs rounded-xl"
            >
              Close
            </Button>
            <Button
              asChild
              className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
            >
              <Link to="/create">Use in Reel</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Place Detail Modal */}
      <Dialog open={Boolean(selectedPlace)} onOpenChange={() => setSelectedPlace(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              {selectedPlace?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              {selectedPlace?.city} • {selectedPlace?.postsCount} photos & stories tagged here
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-3">
            <Button
              variant="surface"
              onClick={() => setSelectedPlace(null)}
              className="flex-1 text-xs rounded-xl"
            >
              Close
            </Button>
            <Button
              asChild
              className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
            >
              <Link to="/create">Tag in Post</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
