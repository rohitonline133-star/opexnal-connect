import { useEffect, useRef, useState, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  MessageSquare,
  PlusSquare,
  Sparkles,
  Radio,
  Star,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { OpexnalWordmark } from "@/components/opexnal/logo";
import { PostCard } from "@/components/opexnal/post-card";
import { StoryTray } from "@/components/opexnal/story-tray";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { FEED_PAGE_SIZE, getHomeFeed } from "@/lib/posts";
import { getStoredSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home Feed — Opexnal" },
      {
        name: "description",
        content: "Your Opexnal home feed of photo and video posts from people you follow.",
      },
      { property: "og:title", content: "Home Feed — Opexnal" },
      {
        property: "og:description",
        content: "Your Opexnal home feed of photo and video posts from people you follow.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeFeed,
});

type FeedTab = "for_you" | "following" | "favorites";

function HomeFeed() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const sentinel = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<FeedTab>("for_you");
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ["home-feed", user?.id],
      enabled: Boolean(user),
      initialPageParam: null as string | null,
      queryFn: ({ pageParam }) => getHomeFeed(user!.id, pageParam, FEED_PAGE_SIZE),
      getNextPageParam: (last) => last.nextCursor,
    });

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const rawPosts = useMemo(() => (data?.pages ?? []).flatMap((page) => page.items), [data?.pages]);

  // Filter posts based on active tab
  const posts = useMemo(() => {
    if (activeTab === "for_you") return rawPosts;
    if (activeTab === "favorites") {
      const favorites = getStoredSettings().favoriteCreators;
      if (favorites.length === 0) return rawPosts;
      return rawPosts.filter((p) => p.author && favorites.includes(p.author.username));
    }
    // following tab
    return rawPosts;
  }, [rawPosts, activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast.success("Feed refreshed ✨");
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={
            <div className="flex items-center gap-2">
              <OpexnalWordmark className="text-lg" />
            </div>
          }
          right={
            <div className="flex items-center gap-1">
              <Link
                to="/live"
                aria-label="Start Live broadcast"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Radio className="h-5 w-5" />
              </Link>
              <Link
                to="/ai"
                aria-label="Opexnal AI Studio"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-primary hover:bg-primary/10 transition-colors"
              >
                <Sparkles className="h-5 w-5" />
              </Link>
              <Link
                to="/messages"
                aria-label="Direct Messages"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-secondary transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>
            </div>
          }
        />
      }
    >
      {/* Feed Filter Switcher (For You / Following / Favorites) */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex bg-surface border border-border p-0.5 rounded-xl gap-0.5">
          {(
            [
              { id: "for_you", label: "For You" },
              { id: "following", label: "Following" },
              { id: "favorites", label: "Favorites" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "favorites" && (
            <Link
              to="/close-friends"
              className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
            >
              <Star className="h-3 w-3" />
              Manage
            </Link>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh feed"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin text-primary")} />
          </button>
        </div>
      </div>

      {user && <StoryTray viewerId={user.id} />}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : isError ? (
        <p className="px-4 py-16 text-center text-sm text-muted-foreground" role="alert">
          We couldn&apos;t load your feed. Pull down or try again in a moment.
        </p>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center max-w-sm mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient-bg text-primary-foreground shadow-md">
            <PlusSquare className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {activeTab === "favorites" ? "No Posts from Favorites Yet" : "Welcome to Opexnal"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {activeTab === "favorites"
              ? "Add favorite creators to see their posts highlighted right here."
              : "Follow creators on Explore or share your first post with photos, videos, and AI magic captions."}
          </p>
          <div className="flex flex-col w-full gap-2 pt-2">
            {activeTab === "favorites" ? (
              <Button
                asChild
                className="w-full brand-gradient-bg text-primary-foreground font-semibold rounded-xl text-xs"
              >
                <Link to="/close-friends">Manage Favorites</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  className="w-full brand-gradient-bg text-primary-foreground font-semibold rounded-xl text-xs"
                >
                  <Link to="/create">Create First Post</Link>
                </Button>
                <Button asChild variant="surface" className="w-full rounded-xl text-xs">
                  <Link to="/explore">Explore Creators</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} viewerId={user?.id ?? null} />
          ))}
          <div ref={sentinel} className="h-8" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            </div>
          )}
          {!hasNextPage && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              You&apos;re all caught up on Opexnal! ✨
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}
