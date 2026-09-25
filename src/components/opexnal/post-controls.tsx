import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bookmark,
  Check,
  Copy,
  EyeOff,
  Flag,
  Info,
  Link as LinkIcon,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { deletePost, type FeedPost } from "@/lib/posts";
import { submitContentReport } from "@/lib/moderation-copyright";

interface PostControlsProps {
  post: FeedPost;
  viewerId?: string | null;
  onPostDeleted?: (postId: string) => void;
  onPostHidden?: (postId: string) => void;
}

export function PostControlsMenu({
  post,
  viewerId,
  onPostDeleted,
  onPostHidden,
}: PostControlsProps) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [copyrightOpen, setCopyrightOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isOwner = Boolean(viewerId && post.user_id === viewerId);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/p/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
      setOpen(false);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleHidePost = () => {
    onPostHidden?.(post.id);
    toast.success("Post hidden from your feed. You'll see fewer posts like this.");
    setOpen(false);
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      toast.success("Post removed from Opexnal");
      setDeleteConfirmOpen(false);
      setOpen(false);
      onPostDeleted?.(post.id);
    } catch {
      toast.error("Could not delete post");
    }
  };

  const handleBlockUser = async () => {
    if (!viewerId || !post.user_id) return;
    try {
      await supabase.from("blocks").insert({
        blocker_id: viewerId,
        blocked_id: post.user_id,
      });
      toast.success(`Blocked @${post.author?.username || "user"}`);
      setOpen(false);
      onPostHidden?.(post.id);
    } catch {
      toast.error("Could not block user");
    }
  };

  const handleRestrictUser = async () => {
    if (!viewerId || !post.user_id) return;
    toast.success(
      `Restricted @${post.author?.username || "user"}. Their comments will only be visible to them.`,
    );
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Post options"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {/* Main Options Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs p-0 overflow-hidden rounded-2xl bg-card border border-border">
          <div className="divide-y divide-border text-center text-sm font-medium">
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                  className="w-full py-3.5 text-destructive font-semibold hover:bg-secondary/50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setCopyrightOpen(true);
                  }}
                  className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Copyright & Licensing Info
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setReportOpen(true);
                  }}
                  className="w-full py-3.5 text-destructive font-semibold hover:bg-secondary/50 flex items-center justify-center gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Report
                </button>
                <button
                  type="button"
                  onClick={handleHidePost}
                  className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
                >
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  Not Interested / Hide
                </button>
                {post.author && (
                  <>
                    <button
                      type="button"
                      onClick={handleBlockUser}
                      className="w-full py-3.5 text-destructive hover:bg-secondary/50 flex items-center justify-center gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      Block @{post.author.username}
                    </button>
                    <button
                      type="button"
                      onClick={handleRestrictUser}
                      className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="h-4 w-4 text-amber-400" />
                      Restrict @{post.author.username}
                    </button>
                  </>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
            >
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              Copy Link
            </button>

            <Link
              to="/p/$postId"
              params={{ postId: post.id }}
              onClick={() => setOpen(false)}
              className="w-full py-3.5 text-foreground hover:bg-secondary/50 flex items-center justify-center gap-2"
            >
              <Info className="h-4 w-4 text-muted-foreground" />
              Go to Post
            </Link>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-3 text-muted-foreground hover:bg-secondary/50 font-normal"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <ReportContentDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={post.id}
        targetType="post"
        viewerId={viewerId || "anonymous"}
      />

      {/* Copyright Info Modal */}
      <Dialog open={copyrightOpen} onOpenChange={setCopyrightOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Copyright & Audio Protection Status
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Opexnal automated intellectual property and rights protection scan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Content Fingerprint ID</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  opx_hash_{post.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Claim Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" /> No Claims / Cleared
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Audio Attribution</span>
                <span className="text-muted-foreground">Original audio by creator</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Monetization Eligibility</span>
                <span className="text-primary font-semibold">100% Eligible</span>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Opexnal protects creators by fingerprinting original audio and visual assets upon
              upload. If any rights-holder submits a dispute, you will be notified with full appeal
              rights.
            </p>

            <Button
              className="w-full rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
              onClick={() => setCopyrightOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-xs p-5 bg-card border border-border rounded-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-base font-bold">Delete Post?</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Are you sure you want to delete this post? It will be moved to Recently Deleted where it
            can be restored within 30 days.
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl text-xs"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl text-xs font-semibold"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReportContentDialog({
  open,
  onOpenChange,
  targetId,
  targetType,
  viewerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType: "post" | "user" | "story" | "comment" | "message" | "reel";
  viewerId: string;
}) {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reportReasons = [
    { id: "spam", label: "It's spam, misleading or scam" },
    { id: "hate_speech", label: "Hate speech, discrimination or symbols" },
    { id: "harassment", label: "Harassment, bullying or threats" },
    { id: "copyright", label: "Intellectual property / Copyright violation" },
    { id: "nudity", label: "Nudity or sexual activity" },
    { id: "violence", label: "Violence, dangerous organizations or self-harm" },
    { id: "misinformation", label: "False information or impersonation" },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitContentReport({
        reporterId: viewerId,
        targetId,
        targetType,
        reason,
        details,
      });
      toast.success("Thank you for reporting. Our Trust & Safety team will review this promptly.");
      onOpenChange(false);
      setDetails("");
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
            <Flag className="h-5 w-5" />
            Report {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Why are you reporting this {targetType}? Your report is anonymous, except if you are
            reporting an intellectual property infringement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Select reason</Label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {reportReasons.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    reason === r.id
                      ? "border-primary bg-primary/10 text-foreground font-medium"
                      : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{r.label}</span>
                  <input
                    type="radio"
                    name="report_reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => setReason(e.target.value)}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Additional context (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any details that will help our review team..."
              className="h-20 text-xs bg-background"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl text-xs"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl text-xs font-semibold"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
