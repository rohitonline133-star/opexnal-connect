import { Fragment, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Heart, MapPin, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { MediaCarousel } from "@/components/opexnal/post-media";
import { cn } from "@/lib/utils";
import { initialsFor } from "@/lib/profile";
import {
  formatCount,
  recordShare,
  timeAgo,
  toggleLike,
  toggleSave,
  type FeedPost,
} from "@/lib/posts";

function Caption({ text }: { text: string }) {
  const parts = text.split(/(#[A-Za-z0-9_]{1,50})/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <Link
            key={`${part}-${i}`}
            to="/tag/$tag"
            params={{ tag: part.slice(1).toLowerCase() }}
            className="text-primary hover:underline"
          >
            {part}
          </Link>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function PostCard({ post, viewerId }: { post: FeedPost; viewerId?: string | null }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.saved);
  const author = post.author;

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
    const url = `${window.location.origin}/p/${post.id}`;
    try {
      const canShare = typeof navigator.share === "function";
      if (canShare) await navigator.share({ url, title: "Opexnal post" });
      else await navigator.clipboard.writeText(url);
      if (viewerId) await recordShare(post.id, viewerId, canShare ? "native" : "link");
      if (!canShare) toast.success("Link copied");
    } catch {
      /* user dismissed share sheet */
    }
  }

  return (
    <article className="border-b border-border pb-4">
      <header className="flex items-center gap-3 px-4 py-3">
        {author ? (
          <Link
            to="/u/$username"
            params={{ username: author.username }}
            className="flex items-center gap-3"
          >
            <ProfileAvatar
              path={author.avatar_url}
              fallback={initialsFor(author)}
              className="h-9 w-9"
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-sm font-semibold">
                {author.username}
                {author.is_verified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                )}
              </p>
              {post.location_name && (
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {post.location_name}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Unknown author</p>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
      </header>

      {post.media.length > 0 && (
        <MediaCarousel media={post.media} alt={post.caption || "Post media"} />
      )}

      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          type="button"
          onClick={onLike}
          aria-label={liked ? "Unlike" : "Like"}
          aria-pressed={liked}
        >
          <Heart
            className={cn(
              "h-6 w-6 transition-colors",
              liked ? "fill-primary text-primary" : "text-foreground",
            )}
          />
        </button>
        <Link to="/p/$postId" params={{ postId: post.id }} aria-label="Comments">
          <MessageCircle className="h-6 w-6" />
        </Link>
        <button type="button" onClick={onShare} aria-label="Share post">
          <Send className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onSave}
          className="ml-auto"
          aria-label={saved ? "Remove save" : "Save post"}
          aria-pressed={saved}
        >
          <Bookmark
            className={cn("h-6 w-6", saved ? "fill-foreground text-foreground" : "text-foreground")}
          />
        </button>
      </div>

      <div className="space-y-1 px-4 pt-2">
        <p className="text-sm font-semibold">{formatCount(likes)} likes</p>
        {post.caption && (
          <p className="whitespace-pre-wrap text-sm">
            {author && <span className="mr-1 font-semibold">{author.username}</span>}
            <Caption text={post.caption} />
          </p>
        )}
        {post.comments_count > 0 && (
          <button
            type="button"
            onClick={() => navigate({ to: "/p/$postId", params: { postId: post.id } })}
            className="text-sm text-muted-foreground"
          >
            View all {formatCount(post.comments_count)} comments
          </button>
        )}
      </div>
    </article>
  );
}
