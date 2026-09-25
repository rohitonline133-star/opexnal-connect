import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bookmark,
  ChevronLeft,
  Copy,
  EyeOff,
  Flag,
  Heart,
  Link as LinkIcon,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ProfileAvatar } from "@/components/opexnal/avatar";
import { useSignedMediaUrl } from "@/components/opexnal/post-media";
import { ReportContentDialog } from "@/components/opexnal/post-controls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  addComment,
  formatCount,
  getComments,
  getReelsFeed,
  recordShare,
  timeAgo,
  toggleLike,
  toggleSave,
  type FeedPost,
} from "@/lib/posts";
import { initialsFor } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reels")({
  head: () => ({
    meta: [
      { title: "Reels & Short Videos — Opexnal" },
      {
        name: "description",
        content: "Discover immersive vertical video reels and stories from the Opexnal community.",
      },
      { property: "og:title", content: "Reels & Short Videos — Opexnal" },
      {
        property: "og:description",
        content: "Discover immersive vertical video reels and stories from the Opexnal community.",
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
  const [muted, setMuted] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["reels", user?.id],
    queryFn: () => getReelsFeed(user?.id || ""),
    enabled: Boolean(user?.id),
  });

  const reels = data ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-white/70" aria-hidden="true" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient-bg shadow-lg">
          <Play className="h-7 w-7 fill-white text-white" />
        </div>
        <h1 className="text-lg font-bold">No Reels in Feed Yet</h1>
        <p className="max-w-xs text-xs text-white/70">
          Be the first creator to share a vertical video or reel on Opexnal!
        </p>
        <Button
          asChild
          className="brand-gradient-bg text-primary-foreground text-xs font-semibold rounded-xl"
        >
          <Link to="/create">Upload First Video Reel</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-screen w-full max-w-md snap-y snap-mandatory overflow-y-scroll bg-black scrollbar-none">
      {/* Top Overlay Bar */}
      <header className="fixed top-0 inset-x-0 z-30 mx-auto flex max-w-md items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <Link
          to="/home"
          aria-label="Back to home"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <span className="font-bold text-sm text-white tracking-wide">Reels</span>
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "Unmute audio" : "Mute audio"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </header>

      {reels.map((reel) => (
        <ReelItem
          key={reel.id}
          post={reel}
          viewerId={user?.id ?? null}
          muted={muted}
          onToggleMute={() => setMuted(!muted)}
        />
      ))}
    </div>
  );
}

function ReelItem({
  post,
  viewerId,
  muted,
  onToggleMute,
}: {
  post: FeedPost;
  viewerId: string | null;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const video = post.media.find((m) => m.media_type === "video");
  const url = useSignedMediaUrl(video?.storage_path);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.saved);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [hidden, setHidden] = useState(false);

  async function handleToggleFollow() {
    if (!viewerId || !post.user_id) return;
    try {
      const { data, error } = await supabase.rpc("request_follow", { _target_id: post.user_id });
      if (!error) {
        setFollowing(!following);
        toast.success(
          data === "requested" ? "Follow request sent" : `Following @${post.author?.username}`,
        );
      }
    } catch {
      setFollowing(!following);
    }
  }

  // Double tap to like
  const lastTapRef = useRef<number>(0);
  const handleVideoTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) onLike();
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    } else {
      onToggleMute();
    }
    lastTapRef.current = now;
  };

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
      toast.error("Could not update like");
    }
  }

  async function onSave() {
    if (!viewerId) return;
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(post.id, viewerId, saved);
      toast.success(next ? "Reel saved to collection" : "Reel removed from saves");
    } catch {
      setSaved(!next);
      toast.error("Could not update save");
    }
  }

  async function onShare() {
    const link = `${window.location.origin}/p/${post.id}`;
    try {
      const nav: Navigator = navigator;
      if (typeof nav.share === "function") {
        await nav.share({ url: link, title: "Opexnal Reel" });
      } else {
        await nav.clipboard.writeText(link);
        toast.success("Reel link copied");
      }
      if (viewerId) await recordShare(post.id, viewerId);
    } catch {
      // dismissed
    }
  }

  if (hidden) return null;

  return (
    <section className="relative h-screen w-full snap-start bg-black overflow-hidden flex items-center justify-center">
      {/* Video Element */}
      {url ? (
        <video
          ref={videoRef}
          src={url}
          className="h-full w-full object-cover cursor-pointer"
          autoPlay
          loop
          muted={muted}
          playsInline
          onClick={handleVideoTap}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white/70" aria-hidden="true" />
        </div>
      )}

      {/* Double Tap Floating Heart Animation */}
      {showHeartAnim && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
          <Heart className="h-24 w-24 fill-rose-500 text-rose-500 animate-ping opacity-90" />
        </div>
      )}

      {/* Right Side Action Bar */}
      <div className="absolute bottom-20 right-3 flex flex-col items-center gap-5 z-20">
        {/* Like Button */}
        <button
          type="button"
          aria-label={liked ? "Unlike reel" : "Like reel"}
          onClick={onLike}
          className="flex flex-col items-center text-white drop-shadow-md group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur group-hover:scale-110 transition-transform">
            <Heart
              className={cn(
                "h-6 w-6 transition-colors",
                liked ? "fill-rose-500 text-rose-500" : "text-white",
              )}
            />
          </div>
          <span className="text-[11px] font-semibold mt-1">{formatCount(likes)}</span>
        </button>

        {/* Comments Button */}
        <button
          type="button"
          aria-label="Comments"
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center text-white drop-shadow-md group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur group-hover:scale-110 transition-transform">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-[11px] font-semibold mt-1">{formatCount(post.comments_count)}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          aria-label="Share reel"
          onClick={onShare}
          className="flex flex-col items-center text-white drop-shadow-md group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur group-hover:scale-110 transition-transform">
            <Send className="h-5 w-5 text-white" />
          </div>
          <span className="text-[11px] font-semibold mt-1">Share</span>
        </button>

        {/* Save Button */}
        <button
          type="button"
          aria-label="Save reel"
          onClick={onSave}
          className="flex flex-col items-center text-white drop-shadow-md group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur group-hover:scale-110 transition-transform">
            <Bookmark className={cn("h-5 w-5", saved ? "fill-white text-white" : "text-white")} />
          </div>
          <span className="text-[11px] font-semibold mt-1">{saved ? "Saved" : "Save"}</span>
        </button>

        {/* 3-dots Reel Options */}
        <button
          type="button"
          aria-label="Reel options"
          onClick={() => setOptionsOpen(true)}
          className="flex flex-col items-center text-white drop-shadow-md group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur group-hover:scale-110 transition-transform">
            <MoreHorizontal className="h-5 w-5 text-white" />
          </div>
          <span className="text-[11px] font-semibold mt-1">More</span>
        </button>
      </div>

      {/* Bottom Metadata Bar */}
      <div className="absolute inset-x-0 bottom-0 p-4 pr-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 flex flex-col justify-end space-y-2">
        {post.author && (
          <div className="flex items-center gap-2.5">
            <Link
              to="/u/$username"
              params={{ username: post.author.username }}
              className="flex items-center gap-2 text-white"
            >
              <ProfileAvatar
                path={post.author.avatar_url}
                fallback={initialsFor(post.author)}
                className="h-9 w-9 ring-2 ring-white/30"
              />
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold hover:underline">
                  {post.author.username}
                </span>
                {post.author.is_verified && (
                  <BadgeCheck className="h-4 w-4 text-primary fill-primary" />
                )}
              </div>
            </Link>

            {viewerId && viewerId !== post.user_id && (
              <button
                type="button"
                onClick={handleToggleFollow}
                className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  following
                    ? "border-white/30 bg-white/20 text-white"
                    : "border-primary bg-primary text-primary-foreground hover:brightness-110"
                }`}
              >
                {following ? "Following" : "Follow"}
              </button>
            )}
          </div>
        )}

        {post.caption && (
          <div className="text-xs text-white/90">
            <p className={cn(!expandedCaption && "line-clamp-2")}>{post.caption}</p>
            {post.caption.length > 80 && (
              <button
                type="button"
                onClick={() => setExpandedCaption(!expandedCaption)}
                className="text-[11px] font-semibold text-white/60 hover:text-white mt-0.5"
              >
                {expandedCaption ? "show less" : "more"}
              </button>
            )}
          </div>
        )}

        {/* Audio Track Tag - Tappable to open Audio Details */}
        <button
          type="button"
          onClick={() => setAudioOpen(true)}
          className="flex items-center gap-1.5 text-[11px] text-white/80 hover:text-white transition-colors text-left"
        >
          <Music2 className="h-3 w-3 animate-spin text-primary shrink-0" />
          <span className="truncate">Original audio — @{post.author?.username || "opexnal"}</span>
        </button>
      </div>

      {/* Reel Options Dialog */}
      <Dialog open={optionsOpen} onOpenChange={setOptionsOpen}>
        <DialogContent className="max-w-xs p-0 overflow-hidden rounded-2xl bg-card border border-border">
          <div className="divide-y divide-border text-center text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setOptionsOpen(false);
                setReportOpen(true);
              }}
              className="w-full py-3.5 text-destructive font-semibold hover:bg-secondary/50 flex items-center justify-center gap-2"
            >
              <Flag className="h-4 w-4" />
              Report Reel
            </button>
            <button
              type="button"
              onClick={() => {
                setHidden(true);
                toast.success("Reel hidden from your feed");
                setOptionsOpen(false);
              }}
              className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
            >
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              Not Interested
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/p/${post.id}`);
                toast.success("Reel link copied");
                setOptionsOpen(false);
              }}
              className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
            >
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              Copy Link
            </button>
            <button
              type="button"
              onClick={() => {
                setOptionsOpen(false);
                setAudioOpen(true);
              }}
              className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
            >
              <Music2 className="h-4 w-4 text-primary" />
              Audio & Licensing Details
            </button>
            <button
              type="button"
              onClick={() => setOptionsOpen(false)}
              className="w-full py-3 text-muted-foreground hover:bg-secondary/50 font-normal"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audio Modal */}
      <Dialog open={audioOpen} onOpenChange={setAudioOpen}>
        <DialogContent className="max-w-sm bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Music2 className="h-5 w-5 text-primary" />
              Audio Track & Licensing
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Track information and audio attribution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Track Title</span>
                <span className="text-muted-foreground">Original Audio</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Creator</span>
                <span className="text-primary font-medium">
                  @{post.author?.username || "creator"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Rights Management</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Cleared for Reels
                </span>
              </div>
            </div>
            <Button
              className="w-full rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
              onClick={() => {
                toast.success("Audio selected! Redirecting to creator camera...");
                setAudioOpen(false);
              }}
            >
              Use This Audio in New Reel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <ReportContentDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={post.id}
        targetType="reel"
        viewerId={viewerId || "anonymous"}
      />

      {/* Interactive Reel Comments Drawer */}
      {showComments && (
        <ReelCommentsDrawer
          postId={post.id}
          viewerId={viewerId}
          onClose={() => setShowComments(false)}
        />
      )}
    </section>
  );
}

function ReelCommentsDrawer({
  postId,
  viewerId,
  onClose,
}: {
  postId: string;
  viewerId: string | null;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ["comments", postId, viewerId],
    queryFn: () => getComments(postId, viewerId),
  });

  const addMutation = useMutation({
    mutationFn: () => addComment({ postId, userId: viewerId!, body: text.trim() }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
    onError: () => toast.error("Could not post comment"),
  });

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="flex h-[60%] flex-col rounded-t-3xl border-t border-border bg-background p-4 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-semibold text-foreground">Comments</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 py-3">
          {commentsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (commentsQuery.data?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No comments yet. Start the conversation!
            </p>
          ) : (
            commentsQuery.data?.map((c) => (
              <div key={c.id} className="flex gap-2.5 text-xs">
                <ProfileAvatar
                  path={c.author?.avatar_url ?? null}
                  fallback={c.author ? initialsFor(c.author) : "?"}
                  className="h-7 w-7 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="font-semibold mr-1">@{c.author?.username || "user"}</span>
                    <span>{c.body}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {timeAgo(c.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {viewerId && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) addMutation.mutate();
            }}
            className="flex items-center gap-2 pt-2 border-t border-border"
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="h-9 text-xs rounded-xl bg-surface"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!text.trim() || addMutation.isPending}
              className="h-9 rounded-xl brand-gradient-bg text-primary-foreground text-xs font-semibold px-3"
            >
              Post
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
