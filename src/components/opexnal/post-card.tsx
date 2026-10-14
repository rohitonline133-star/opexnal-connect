import { Fragment, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  MoreHorizontal,
  EyeOff,
  Clock,
  UserMinus,
  Flag,
  HelpCircle,
  Star,
  Archive,
  Trash2,
  Edit3,
  Sliders,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { MediaCarousel } from "@/components/opexnal/post-media";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { getStoredSettings, saveSettings } from "@/lib/settings-store";

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
  const [hidden, setHidden] = useState(false);
  const [captionText, setCaptionText] = useState(post.caption || "");
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);

  // 3 Dots Menu States
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "why" | "report" | "edit" | "delete" | "archive" | null
  >(null);
  const [editInput, setEditInput] = useState(captionText);

  const author = post.author;
  const isOwner = Boolean(viewerId && author && viewerId === author.id);

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
      if (!canShare) toast.success("Link copied to clipboard");
    } catch {
      /* user dismissed share sheet */
    }
  }

  // 3-Dots Action Handlers
  const handleHidePost = () => {
    setHidden(true);
    setMenuOpen(false);
    toast.success("Post hidden from your feed");
  };

  const handleSnooze = () => {
    setHidden(true);
    setMenuOpen(false);
    toast.success(`Snoozed @${author?.username || "creator"} for 30 days`);
  };

  const handleUnfollow = () => {
    setMenuOpen(false);
    toast.success(`Unfollowed @${author?.username || "creator"}`);
  };

  const handleToggleFavorite = () => {
    if (!author) return;
    const settings = getStoredSettings();
    const isFav = settings.favoriteCreators.includes(author.username);
    const updated = isFav
      ? settings.favoriteCreators.filter((u) => u !== author.username)
      : [...settings.favoriteCreators, author.username];
    saveSettings({ favoriteCreators: updated });
    setMenuOpen(false);
    toast.success(
      isFav
        ? `Removed @${author.username} from Favorites`
        : `Added @${author.username} to Favorites ⭐`,
    );
  };

  const handleSaveEdit = () => {
    setCaptionText(editInput);
    setActiveModal(null);
    toast.success("Caption updated successfully");
  };

  const handleArchivePost = () => {
    setHidden(true);
    setActiveModal(null);
    toast.success("Post moved to your private Archive");
  };

  const handleDeletePost = () => {
    setHidden(true);
    setActiveModal(null);
    // Add to Recently Deleted in settings store
    const settings = getStoredSettings();
    const newItem = {
      id: post.id,
      type: "post" as const,
      title: captionText.slice(0, 30) || "Post without caption",
      deletedAt: "Just now",
      daysRemaining: 30,
    };
    saveSettings({
      recentlyDeletedItems: [newItem, ...(settings.recentlyDeletedItems || [])],
    });
    toast.success("Post deleted — you can restore it from Recently Deleted within 30 days");
  };

  const handleReportSubmit = (reason: string) => {
    setActiveModal(null);
    setHidden(true);
    toast.success(`Thank you. We received your report for "${reason}".`);
  };

  if (hidden) {
    return (
      <div className="p-4 border-b border-border bg-surface/50 text-center space-y-1.5">
        <p className="text-xs text-muted-foreground">This post has been hidden from your feed.</p>
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="text-xs text-primary font-semibold hover:underline"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <article className="border-b border-border pb-4">
      <header className="flex items-center gap-3 px-4 py-3">
        {author ? (
          <Link
            to="/u/$username"
            params={{ username: author.username }}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <ProfileAvatar
              path={author.avatar_url}
              fallback={initialsFor(author)}
              className="h-9 w-9 shrink-0"
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-sm font-semibold">
                {author.username}
                {author.is_verified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                )}
              </p>
              {post.location_name && (
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {post.location_name}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground flex-1">Unknown author</p>
        )}

        <span className="text-xs text-muted-foreground mr-1" suppressHydrationWarning>
          {timeAgo(post.created_at)}
        </span>

        {/* 3-Dots Action Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          aria-label="Post actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      {post.media.length > 0 && (
        <MediaCarousel media={post.media} alt={captionText || "Post media"} />
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
        {!commentsDisabled && (
          <Link to="/p/$postId" params={{ postId: post.id }} aria-label="Comments">
            <MessageCircle className="h-6 w-6" />
          </Link>
        )}
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
        {!hideLikes && <p className="text-sm font-semibold">{formatCount(likes)} likes</p>}
        {captionText && (
          <p className="whitespace-pre-wrap text-sm">
            {author && <span className="mr-1 font-semibold">{author.username}</span>}
            <Caption text={captionText} />
          </p>
        )}
        {!commentsDisabled && post.comments_count > 0 && (
          <button
            type="button"
            onClick={() => navigate({ to: "/p/$postId", params: { postId: post.id } })}
            className="text-sm text-muted-foreground"
          >
            View all {formatCount(post.comments_count)} comments
          </button>
        )}
        {commentsDisabled && (
          <p className="text-xs text-muted-foreground italic">Comments are turned off</p>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3-DOTS ACTION BOTTOM SHEET / MODAL */}
      {/* ============================================================== */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-3 bg-card border-border">
          <div className="divide-y divide-border text-xs">
            {/* Viewer or Owner Options */}
            {!isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveModal("why");
                  }}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-semibold"
                >
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span>Why am I seeing this post</span>
                </button>

                <button
                  type="button"
                  onClick={handleHidePost}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <span>Hide post / Not Interested</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <Star className="h-4 w-4 text-amber-400" />
                  <span>Add/Remove from Favorites</span>
                </button>

                <button
                  type="button"
                  onClick={handleSnooze}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Snooze @{author?.username} for 30 days</span>
                </button>

                <button
                  type="button"
                  onClick={handleUnfollow}
                  className="w-full flex items-center gap-3 p-3 text-destructive hover:bg-surface rounded-xl transition-colors font-medium"
                >
                  <UserMinus className="h-4 w-4 text-destructive" />
                  <span>Unfollow @{author?.username}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveModal("report");
                  }}
                  className="w-full flex items-center gap-3 p-3 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold"
                >
                  <Flag className="h-4 w-4 text-destructive" />
                  <span>Report post</span>
                </button>
              </>
            ) : (
              <>
                {/* Author Options */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveModal("edit");
                  }}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors font-semibold"
                >
                  <Edit3 className="h-4 w-4 text-primary" />
                  <span>Edit Caption</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHideLikes(!hideLikes);
                    setMenuOpen(false);
                    toast.success(hideLikes ? "Like count visible" : "Like count hidden");
                  }}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <Sliders className="h-4 w-4 text-muted-foreground" />
                  <span>{hideLikes ? "Unhide like count" : "Hide like count"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCommentsDisabled(!commentsDisabled);
                    setMenuOpen(false);
                    toast.success(commentsDisabled ? "Comments enabled" : "Comments turned off");
                  }}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{commentsDisabled ? "Turn on commenting" : "Turn off commenting"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveModal("archive");
                  }}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <span>Archive post</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveModal("delete");
                  }}
                  className="w-full flex items-center gap-3 p-3 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span>Delete post</span>
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Why Am I Seeing This Dialog */}
      <Dialog open={activeModal === "why"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Why You're Seeing This Post
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Opexnal shows content based on your connections and interests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
              <p className="font-semibold text-foreground">You follow @{author?.username}</p>
              <p className="text-[11px] text-muted-foreground">
                This post was shared by an account you follow in your primary feed.
              </p>
            </div>
            <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
              <p className="font-semibold text-foreground">Content Engagement</p>
              <p className="text-[11px] text-muted-foreground">
                You frequently interact with photo posts and design content on Opexnal.
              </p>
            </div>
          </div>
          <Button
            variant="surface"
            onClick={() => setActiveModal(null)}
            className="w-full text-xs rounded-xl"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Report Post Dialog */}
      <Dialog open={activeModal === "report"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Report Post
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Why are you reporting this post? Your report is anonymous.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            {[
              "It's spam or a scam",
              "Hate speech or symbols",
              "Nudity or sexual content",
              "Violence or dangerous organizations",
              "Harassment or bullying",
              "Intellectual property violation",
            ].map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => handleReportSubmit(reason)}
                className="w-full p-2.5 text-left text-xs bg-surface border border-border rounded-xl hover:bg-secondary transition-colors"
              >
                {reason}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Caption Dialog */}
      <Dialog open={activeModal === "edit"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" />
              Edit Caption
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <textarea
              rows={3}
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface border border-border text-xs focus:outline-none"
            />
            <div className="flex gap-2">
              <Button
                variant="surface"
                onClick={() => setActiveModal(null)}
                className="flex-1 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Post Dialog */}
      <Dialog open={activeModal === "archive"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Archive className="h-4 w-4 text-primary" />
              Archive Post?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Only you will be able to see this post once archived. You can show it on your profile
              again at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="surface"
              onClick={() => setActiveModal(null)}
              className="flex-1 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchivePost}
              className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
            >
              Archive
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Post Dialog */}
      <Dialog open={activeModal === "delete"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Post?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              This post will be moved to Recently Deleted. You can restore it within 30 days before
              it is permanently erased.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="surface"
              onClick={() => setActiveModal(null)}
              className="flex-1 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              className="flex-1 text-xs rounded-xl font-semibold"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
