import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  RotateCcw,
  Flag,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { ModerationQueueItem } from "@/lib/moderation";

export function ModerationAppealsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"appeals" | "reports" | "guidelines">("appeals");
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [appealText, setAppealText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchQueue() {
      try {
        const res = await fetch("/api/moderation/queue");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch {
        // ignore
      }
    }
    fetchQueue();
  }, []);

  async function submitAppeal(queueId: string) {
    if (!appealText.trim()) {
      toast.error("Please explain why this content complies with Community Guidelines.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/moderation/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId, appealReason: appealText.trim() }),
      });
      if (res.ok) {
        toast.success(
          "Appeal submitted! A human Trust & Safety reviewer will evaluate your content.",
        );
        setAppealingId(null);
        setAppealText("");
        // refresh
        const qRes = await fetch("/api/moderation/queue");
        if (qRes.ok) {
          const data = await qRes.json();
          setItems(data.items || []);
        }
      } else {
        toast.error("Failed to submit appeal.");
      }
    } catch {
      toast.error("Network error submitting appeal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Content Safety, Reports & Appeals
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Track moderation actions, appeal flagged content, and monitor submitted reports. Opexnal
          does not silently delete legitimate content.
        </DialogDescription>
      </DialogHeader>

      <div className="flex border-b border-border text-xs">
        <button
          type="button"
          onClick={() => setTab("appeals")}
          className={`px-3 py-2 font-semibold border-b-2 transition-colors ${
            tab === "appeals"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Moderation & Appeals ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`px-3 py-2 font-semibold border-b-2 transition-colors ${
            tab === "reports"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Reports Sent
        </button>
        <button
          type="button"
          onClick={() => setTab("guidelines")}
          className={`px-3 py-2 font-semibold border-b-2 transition-colors ${
            tab === "guidelines"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Policies
        </button>
      </div>

      {tab === "appeals" && (
        <div className="space-y-3 pt-1 text-xs">
          {items.length === 0 ? (
            <div className="p-6 rounded-2xl bg-secondary/30 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-foreground">Clean Account Standing</p>
              <p className="text-muted-foreground">
                You have no active moderation warnings, content flags, or pending appeals.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-border bg-surface space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                    {item.targetType} • Category: {item.category}
                  </span>
                  <Badge
                    variant={
                      item.status === "clean"
                        ? "default"
                        : item.status === "warning_issued"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-[9px] uppercase font-bold"
                  >
                    {item.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/40 text-[11px] font-mono text-muted-foreground line-clamp-2">
                  "{item.snippet}"
                </div>

                <div className="space-y-1">
                  {item.reasons.map((r, i) => (
                    <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400">
                      • {r}
                    </p>
                  ))}
                </div>

                {/* Appeal section */}
                {item.appealSubmitted ? (
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Appeal in review by Trust & Safety human moderator.</span>
                  </div>
                ) : appealingId === item.id ? (
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-semibold text-foreground">
                      Explain Why This Content Complies:
                    </label>
                    <Textarea
                      placeholder="Provide context or explanation for why this was an accidental flag..."
                      value={appealText}
                      onChange={(e) => setAppealText(e.target.value)}
                      className="text-xs rounded-xl h-20"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs flex-1"
                        onClick={() => setAppealingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-xl text-xs flex-1"
                        disabled={isSubmitting}
                        onClick={() => submitAppeal(item.id)}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Appeal"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-7 gap-1"
                      onClick={() => {
                        setAppealingId(item.id);
                        setAppealText("");
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Request Human Review
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3 pt-1 text-xs">
          <div className="p-3.5 rounded-2xl border border-border bg-surface space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Report #REP-4091</span>
              <Badge variant="secondary" className="text-[9px]">
                Under Investigation
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Type: Spam and deceptive marketing links. Submitted on Feb 28, 2026.
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            You will receive in-app and email notifications once a report decision is reached.
          </p>
        </div>
      )}

      {tab === "guidelines" && (
        <div className="space-y-3 pt-1 text-xs text-muted-foreground leading-relaxed">
          <div className="p-3 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <p className="font-semibold text-foreground">Anti-Harassment & Integrity</p>
            <p>
              We protect authentic creators. Explicit threats, impersonation, hate speech, and bulk
              scam operations are subject to immediate warning and restricted distribution.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <p className="font-semibold text-foreground">No Silent Content Deletion</p>
            <p>
              Every moderation action is recorded with transparent rationale. Authors retain the
              right to submit an appeal with secondary human review.
            </p>
          </div>
        </div>
      )}

      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
