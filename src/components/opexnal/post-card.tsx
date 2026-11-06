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
  QrCode,
  Pin,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { MediaCarousel } from "@/components/opexnal/post-media";
import { PostShareDialog } from "@/components/opexnal/post-share-dialog";
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
  reportPost,
  timeAgo,
  updatePost,
  deletePost,
  toggleLike,
  toggleSave,
  unfollowUser,
  hidePostForViewer,
  snoozeCreatorForViewer,
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
  const [commentsDisabled, setCommentsDisabled] = useState(post.comments_enabled === false);
  const [hideLikes, setHideLikes] = useState(post.hide_likes_count === true);
  const [hideShares, setHideShares] = useState(post.hide_share_count === true);
  const [isPinned, setIsPinned] = useState(post.is_pinned === true);

  // 3 Dots Menu States
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "why" | "report" | "edit" | "delete" | "archive" | "qr" | null
  >(null);
  const [editInput, setEditInput] = useState(captionText);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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

  function onShare() {
    setShareDialogOpen(true);
  }

  // 3-Dots Action Handlers
  const handleShowQr = async () => {
    try {
      const url = `${window.location.origin}/p/${post.id}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: "M" });
      setQrDataUrl(dataUrl);
      setMenuOpen(false);
      setActiveModal("qr");
    } catch {
      toast.error("Could not create a QR code for this post.");
    }
  };

  const handleHidePost = async () => {
    if (!viewerId) {
      toast.error("Sign in to hide this post.");
      return;
    }
    try {
      await hidePostForViewer(post.id);
      setHidden(true);
      setMenuOpen(false);
      toast.success("Post hidden from your feed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not hide this post.");
    }
  };

  const handleSnooze = async () => {
    if (!viewerId || !author?.id) {
      toast.error("Sign in to snooze this creator.");
      return;
    }
    try {
      await snoozeCreatorForViewer(author.id);
      setHidden(true);
      setMenuOpen(false);
      toast.success(`@${author.username} snoozed for 30 days.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not snooze this creator.");
    }
  };

  const handleUnfollow = async () => {
    if (!viewerId || !author?.id) {
      toast.error("Sign in to unfollow this creator.");
      return;
    }
    try {
      await unfollowUser(author.id);
      setHidden(true);
      setMenuOpen(false);
      toast.success(`Unfollowed @${author.username}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not unfollow this creator.");
    }
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

  const handleSaveEdit = async () => {
    if (!isOwner) return;
    try {
      const result = await updatePost(post.id, { caption: editInput });
      setCaptionText(result.post.caption);
      setActiveModal(null);
      toast.success("Caption updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update caption.");
    }
  };

  const handleArchivePost = async () => {
    if (!isOwner) return;
    try {
      await updatePost(post.id, { isArchived: true });
      setHidden(true);
      setActiveModal(null);
      toast.success("Post moved to your private Archive.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not archive this post.");
    }
  };

  const handleDeletePost = async () => {
    if (!isOwner) return;
    try {
      await deletePost(post.id, viewerId || undefined);
      setHidden(true);
      setActiveModal(null);
      toast.success("Post deleted successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this post.");
    }
  };

  const handleReportSubmit = async (reason: string) => {
    if (!viewerId) {
      toast.error("Sign in to report this post.");
      return;
    }
    try {
      await reportPost(post.id, reason);
      setActiveModal(null);
      setHidden(true);
      toast.success("Thank you. Your report was submitted for review.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your report.");
    }
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
        {!hideShares && post.shares_count > 0 && (
          <p className="text-xs text-muted-foreground">{formatCount(post.shares_count)} shares</p>
        )}
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
                  onClick={async () => {
                    if (!isOwner) return;
                    const nextHidden = !hideLikes;
                    try {
                      await updatePost(post.id, { hideLikesCount: nextHidden });
                      setHideLikes(nextHidden);
                      setMenuOpen(false);
                      toast.success(nextHidden ? "Like count hidden" : "Like count visible");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not update like count visibility.");
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <Sliders className="h-4 w-4 text-muted-foreground" />
                  <span>{hideLikes ? "Unhide like count" : "Hide like count"}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!isOwner) return;
                    const nextHidden = !hideShares;
                    try {
                      await updatePost(post.id, { hideShareCount: nextHidden });
                      setHideShares(nextHidden);
                      setMenuOpen(false);
                      toast.success(nextHidden ? "Share count hidden" : "Share count visible");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not update share count visibility.");
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <Sliders className="h-4 w-4 text-muted-foreground" />
                  <span>{hideShares ? "Unhide share count" : "Hide share count"}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!isOwner) return;
                    const nextDisabled = !commentsDisabled;
                    try {
                      await updatePost(post.id, { commentsEnabled: !nextDisabled });
                      setCommentsDisabled(nextDisabled);
                      setMenuOpen(false);
                      toast.success(nextDisabled ? "Comments turned off" : "Comments enabled");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not update comment settings.");
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{commentsDisabled ? "Turn on commenting" : "Turn off commenting"}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await updatePost(post.id, { isPinned: !isPinned });
                      setIsPinned(!isPinned);
                      setMenuOpen(false);
                      toast.success(isPinned ? "Post unpinned from your profile." : "Post pinned to your profile.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not update pinned post.");
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <Pin className="h-4 w-4 text-muted-foreground" />
                  <span>{isPinned ? "Unpin from profile" : "Pin to profile"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleShowQr()}
                  className="w-full flex items-center gap-3 p-3 text-foreground hover:bg-surface rounded-xl transition-colors"
                >
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  <span>QR code for this post</span>
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

      {/* Post QR Code Dialog */}
      <Dialog open={activeModal === "qr"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              Share this post
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Scan this code to open the Opexnal post.
            </DialogDescription>
          </DialogHeader>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code linking to this Opexnal post" className="mx-auto h-64 w-64 rounded-xl bg-white p-2" />
          ) : (
            <p role="status" className="py-8 text-center text-sm text-muted-foreground">Creating QR code…</p>
          )}
          <Button variant="surface" onClick={() => setActiveModal(null)} className="w-full rounded-xl">
            Close
          </Button>
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
              This action permanently deletes the post. It cannot currently be restored from a
              Recently Deleted folder.
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
      <PostShareDialog postId={post.id} open={shareDialogOpen} onOpenChange={setShareDialogOpen} />
    </article>
  );
}
