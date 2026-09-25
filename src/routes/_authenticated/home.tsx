import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MessageSquare, PlusSquare, Sparkles } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { OpexnalWordmark } from "@/components/opexnal/logo";
import { PostCard } from "@/components/opexnal/post-card";
import { StoryTray } from "@/components/opexnal/story-tray";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { FEED_PAGE_SIZE, getHomeFeed } from "@/lib/posts";

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

function HomeFeed() {
  const { user } = useSession();
  const sentinel = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
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

  const posts = (data?.pages ?? []).flatMap((page) => page.items);

  return (
    <AppShell
      header={
        <ScreenHeader
          title={<OpexnalWordmark className="text-lg" />}
          right={
            <div className="flex items-center gap-1.5">
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
          <h2 className="text-lg font-bold text-foreground">Welcome to Opexnal</h2>
          <p className="text-xs text-muted-foreground">
            Follow creators on Explore or share your first post with photos, videos, and AI magic
            captions.
          </p>
          <div className="flex flex-col w-full gap-2 pt-2">
            <Button
              asChild
              className="w-full brand-gradient-bg text-primary-foreground font-semibold rounded-xl text-xs"
            >
              <Link to="/create">Create First Post</Link>
            </Button>
            <Button asChild variant="surface" className="w-full rounded-xl text-xs">
              <Link to="/explore">Explore Creators</Link>
            </Button>
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
