import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Camera, Copy, Loader2, Play } from "lucide-react";

import { MediaThumb } from "@/components/opexnal/post-media";
import { getUserPostsPage } from "@/lib/posts";

export function PostGrid({
  userId,
  viewerId,
  emptyMessage = "No posts yet.",
}: {
  userId: string;
  viewerId?: string | null;
  emptyMessage?: string;
}) {
  const sentinel = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["user-posts", userId, viewerId ?? null],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => getUserPostsPage(userId, viewerId, pageParam),
    getNextPageParam: (last) => last.nextCursor,
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="px-6 py-16 text-center text-sm text-muted-foreground">
        Couldn't load posts. Pull down or try again later.
      </p>
    );
  }

  const posts = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center px-8 py-16 text-center">
        <Camera className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-3 gap-0.5 p-0.5">
        {posts.map((post) => {
          const first = post.media[0];
          return (
            <li key={post.id} className="relative">
              <Link
                to="/p/$postId"
                params={{ postId: post.id }}
                aria-label={post.caption ? post.caption.slice(0, 80) : "Open post"}
                className="block aspect-square overflow-hidden bg-secondary"
              >
                <MediaThumb
                  media={first}
                  alt={post.caption ? post.caption.slice(0, 80) : "Post media"}
                  className="h-full w-full"
                />
              </Link>
              {first?.media_type === "video" && (
                <Play
                  className="pointer-events-none absolute right-1.5 top-1.5 h-4 w-4 fill-foreground text-foreground drop-shadow"
                  aria-label="Video"
                />
              )}
              {post.media.length > 1 && (
                <Copy
                  className="pointer-events-none absolute right-1.5 top-1.5 h-4 w-4 text-foreground drop-shadow"
                  aria-label="Multiple items"
                />
              )}
            </li>
          );
        })}
      </ul>

      <div ref={sentinel} className="h-6" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
