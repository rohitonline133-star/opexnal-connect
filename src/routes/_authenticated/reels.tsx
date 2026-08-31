import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Heart, Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { ProfileAvatar } from "@/components/opexnal/avatar";
import { useSignedMediaUrl } from "@/components/opexnal/post-media";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import {
  formatCount,
  getReelsFeed,
  recordShare,
  toggleLike,
  toggleSave,
  type FeedPost,
} from "@/lib/posts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reels")({
  head: () => ({
    meta: [
      { title: "Reels — Opexnal" },
      { name: "description", content: "Scroll short vertical videos from the Opexnal community." },
      { property: "og:title", content: "Reels — Opexnal" },
      {
        property: "og:description",
        content: "Scroll short vertical videos from the Opexnal community.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReelsPage,
});

function ReelsPage() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["reels", user?.id],
    queryFn: () => getReelsFeed(user!.id),
    enabled: Boolean(user?.id),
  });

  const reels = data ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-5 w-5 animate-spin text-white/70" aria-hidden="true" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black px-8 text-center">
        <h1 className="text-lg font-semibold text-white">No reels yet</h1>
        <p className="text-sm text-white/60">Share a video post and it will show up here.</p>
        <Link to="/create" className="text-sm text-primary hover:underline">
          Create a video post
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto h-screen w-full max-w-md snap-y snap-mandatory overflow-y-scroll bg-black">
      {reels.map((reel) => (
        <Reel key={reel.id} post={reel} viewerId={user?.id ?? null} />
      ))}
    </div>
  );
}

function Reel({ post, viewerId }: { post: FeedPost; viewerId: string | null }) {
  const video = post.media.find((m) => m.media_type === "video");
  const url = useSignedMediaUrl(video?.storage_path);
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.saved);

  async function onLike() {
    if (!viewerId) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    try {
      await toggleLike(post.id, viewerId, liked);
    } catch {
      setLiked(!next);
      setLikes((n) => Math.max(0, n + (next ? -1 : 1)));
      toast.error("Could not update your like");
    }
  }

  async function onSave() {
    if (!viewerId) return;
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(post.id, viewerId, saved);
    } catch {
      setSaved(!next);
      toast.error("Could not update your save");
    }
  }

  async function onShare() {
    const link = `${window.location.origin}/p/${post.id}`;
    try {
      const nav: Navigator = navigator;
      if (typeof nav.share === "function") {
        await nav.share({ url: link, title: "Opexnal reel" });
      } else {
        await nav.clipboard.writeText(link);
        toast.success("Link copied");
      }
      if (viewerId) await recordShare(post.id, viewerId);
    } catch {
      /* user cancelled */
    }
  }

  return (
    <section className="relative h-screen w-full snap-start">
      {url ? (
        <video
          src={url}
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          controls={false}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/70" aria-hidden="true" />
        </div>
      )}

      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5">
        <button
          type="button"
          aria-label="Like"
          onClick={onLike}
          className="flex flex-col items-center text-white"
        >
          <Heart
            className={cn("h-6 w-6", liked && "fill-primary text-primary")}
            aria-hidden="true"
          />
          <span className="text-xs">{formatCount(likes)}</span>
        </button>
        <Link
          to="/p/$postId"
          params={{ postId: post.id }}
          aria-label="Comments"
          className="flex flex-col items-center text-white"
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs">{formatCount(post.comments_count)}</span>
        </Link>
        <button type="button" aria-label="Share" onClick={onShare} className="text-white">
          <Send className="h-6 w-6" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Save" onClick={onSave} className="text-white">
          <Bookmark className={cn("h-6 w-6", saved && "fill-white")} aria-hidden="true" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-8 px-4 pr-20">
        {post.author && (
          <Link
            to="/u/$username"
            params={{ username: post.author.username }}
            className="flex items-center gap-2 text-white"
          >
            <ProfileAvatar
              path={post.author.avatar_url}
              fallback={initialsFor(post.author)}
              className="h-8 w-8"
            />
            <span className="text-sm font-semibold">{post.author.username}</span>
            {post.author.is_verified && (
              <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified" />
            )}
          </Link>
        )}
        {post.caption && <p className="mt-2 line-clamp-2 text-sm text-white/90">{post.caption}</p>}
      </div>
    </section>
  );
}
