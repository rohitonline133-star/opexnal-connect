import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HelpCircle,
  AlertCircle,
  FileText,
  ShieldAlert,
  Info,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  Paperclip,
  ExternalLink,
  LifeBuoy,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Help Center & Support — Opexnal" },
      {
        name: "description",
        content:
          "Get support, report technical issues, review account standing and privacy policies.",
      },
    ],
  }),
  component: HelpPage,
});

type HelpSection = "center" | "report_problem" | "support_requests" | "account_status" | "about";

interface SupportTicket {
  caseId: string;
  category: string;
  description: string;
  status: "Open" | "In Review" | "Resolved";
  submittedAt: string;
}

export function HelpPage() {
  const [section, setSection] = useState<HelpSection>("center");

  // Report a problem form state
  const [category, setCategory] = useState("Something isn't working");
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      caseId: "OPX-84920",
      category: "Reels Audio Sync",
      description: "Audio playback was lagging by 0.5s on Android Chrome.",
      status: "Resolved",
      submittedAt: "Sep 12, 2024",
    },
    {
      caseId: "OPX-91042",
      category: "Story Upload Quality",
      description: "Story video compression seemed unusually high on Wi-Fi.",
      status: "In Review",
      submittedAt: "Sep 22, 2024",
    },
  ]);

  const handleSubmitProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please explain what happened");
      return;
    }

    const newCaseId = `OPX-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTicket: SupportTicket = {
      caseId: newCaseId,
      category,
      description: description.trim(),
      status: "Open",
      submittedAt: "Just now",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSubmittedCaseId(newCaseId);
    setDescription("");
    setAttachmentName("");
    toast.success(`Report submitted! Case ID: ${newCaseId}`);
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={
            section === "center"
              ? "Help Center"
              : section === "report_problem"
                ? "Report a Problem"
                : section === "support_requests"
                  ? "Support Requests"
                  : section === "account_status"
                    ? "Account Status"
                    : "About Opexnal"
          }
          left={
            section === "center" ? (
              <Link
                to="/settings"
                aria-label="Back"
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSection("center");
                  setSubmittedCaseId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )
          }
        />
      }
    >
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* ============================================================== */}
        {/* MAIN HELP DIRECTORY */}
        {/* ============================================================== */}
        {section === "center" && (
          <div className="space-y-4">
            {/* Top Banner */}
            <div className="p-5 bg-card border border-border rounded-3xl space-y-2 text-center shadow-xs">
              <LifeBuoy className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-base font-bold text-foreground">How can we help you?</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Search FAQs, file a technical report, or check your account standing.
              </p>
            </div>

            {/* Menu Options */}
            <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setSection("report_problem")}
                className="w-full flex items-center justify-between p-4 hover:bg-surface text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Report a Problem</p>
                    <p className="text-[11px] text-muted-foreground">
                      Let us know if something isn't working
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => setSection("support_requests")}
                className="w-full flex items-center justify-between p-4 hover:bg-surface text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Support Requests</p>
                    <p className="text-[11px] text-muted-foreground">
                      View submitted reports & status ({tickets.length})
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => setSection("account_status")}
                className="w-full flex items-center justify-between p-4 hover:bg-surface text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Account Status</p>
                    <p className="text-[11px] text-muted-foreground">
                      Violations, strikes & community guidelines
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => setSection("about")}
                className="w-full flex items-center justify-between p-4 hover:bg-surface text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-indigo-400" />
                  <div>
                    <p className="text-xs font-bold text-foreground">About Opexnal</p>
                    <p className="text-[11px] text-muted-foreground">
                      Terms of service, privacy policy & build info
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Quick FAQ Accordions */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-3 shadow-xs">
              <p className="text-xs font-bold text-foreground">Popular Topics</p>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-surface border border-border rounded-2xl space-y-1">
                  <p className="font-semibold text-foreground">
                    How do Close Friends stories work?
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Close friends stories are only visible to the people you add to your Close
                    Friends list. They feature a green ring badge in the tray.
                  </p>
                </div>
                <div className="p-3 bg-surface border border-border rounded-2xl space-y-1">
                  <p className="font-semibold text-foreground">
                    What happens when I archive a post?
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Archived posts are removed from your public profile grid and safely saved in
                    your Archive. You can restore them anytime with likes & comments preserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* REPORT A PROBLEM FLOW */}
        {/* ============================================================== */}
        {section === "report_problem" && (
          <div className="space-y-4">
            {submittedCaseId ? (
              <div className="p-6 bg-card border border-border rounded-3xl text-center space-y-3 shadow-xs">
                <div className="h-12 w-12 rounded-2xl brand-gradient-bg flex items-center justify-center text-white mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Thank You for Your Report</h3>
                <p className="text-xs text-muted-foreground">
                  Our engineering team has logged this issue. You can track its progress under
                  Support Requests.
                </p>
                <div className="p-3 bg-surface border border-border rounded-xl font-mono text-xs text-primary font-bold">
                  Case ID: {submittedCaseId}
                </div>
                <Button
                  variant="surface"
                  onClick={() => {
                    setSubmittedCaseId(null);
                    setSection("support_requests");
                  }}
                  className="w-full text-xs rounded-xl"
                >
                  View Support Requests
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitProblem}
                className="p-5 bg-card border border-border rounded-3xl space-y-4 shadow-xs"
              >
                <div>
                  <label className="text-xs font-semibold block mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option>Something isn't working</option>
                    <option>Media upload or playback failure</option>
                    <option>Direct Messages or notifications issue</option>
                    <option>Account login or security error</option>
                    <option>Spam, abuse or safety concern</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Briefly explain what happened
                  </label>
                  <Textarea
                    placeholder="Include details such as steps to reproduce the issue or error messages..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="rounded-xl bg-surface border-border text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Attach Screenshot (Optional)
                  </label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="file"
                      id="report-file-input"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setAttachmentName(file.name);
                      }}
                    />
                    <Button
                      type="button"
                      variant="surface"
                      onClick={() => document.getElementById("report-file-input")?.click()}
                      className="text-xs h-9 rounded-xl flex items-center gap-1.5"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>{attachmentName ? "Change File" : "Choose File"}</span>
                    </Button>
                    {attachmentName && (
                      <span className="text-[11px] text-muted-foreground truncate flex-1">
                        {attachmentName}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 brand-gradient-bg text-white font-bold rounded-2xl text-xs"
                >
                  Submit Bug Report
                </Button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SUPPORT REQUESTS TRACKER */}
        {/* ============================================================== */}
        {section === "support_requests" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground px-1">
              Your Case History ({tickets.length})
            </p>

            <div className="space-y-2">
              {tickets.map((t) => (
                <div
                  key={t.caseId}
                  className="p-4 bg-card border border-border rounded-2xl space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {t.caseId}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {t.category}
                      </Badge>
                    </div>
                    <Badge
                      className={cn(
                        "text-[10px]",
                        t.status === "Resolved"
                          ? "bg-emerald-500/20 text-emerald-400 border-0"
                          : t.status === "In Review"
                            ? "bg-amber-500/20 text-amber-400 border-0"
                            : "bg-blue-500/20 text-blue-400 border-0",
                      )}
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                  <p className="text-[10px] text-muted-foreground/70">Submitted {t.submittedAt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ACCOUNT STATUS & VIOLATIONS */}
        {/* ============================================================== */}
        {section === "account_status" && (
          <div className="space-y-4">
            <div className="p-5 bg-card border border-border rounded-3xl text-center space-y-2 shadow-xs">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Good Standing</h3>
              <p className="text-xs text-muted-foreground">
                You have no active violations or strikes on your account. Thank you for making
                Opexnal a safe and creative community!
              </p>
            </div>

            <div className="p-4 bg-card border border-border rounded-2xl space-y-2 text-xs">
              <p className="font-bold text-foreground">Community Guidelines Summary</p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                <li>Only share photos and videos that you own or have the right to share.</li>
                <li>Post authentic content and do not engage in artificial spam.</li>
                <li>Respect other members of the Opexnal community at all times.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABOUT OPEXNAL */}
        {/* ============================================================== */}
        {section === "about" && (
          <div className="space-y-4">
            <div className="p-5 bg-card border border-border rounded-3xl space-y-3 shadow-xs">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold brand-gradient-text">Opexnal Connect</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  v2.4.0 (Production Release)
                </p>
              </div>

              <div className="divide-y divide-border text-xs pt-2">
                <div className="py-2.5 flex justify-between">
                  <span className="text-muted-foreground">Terms of Service</span>
                  <span className="font-semibold text-primary">Read Terms</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-muted-foreground">Privacy Policy</span>
                  <span className="font-semibold text-primary">Read Policy</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-muted-foreground">Open Source Notices</span>
                  <span className="font-semibold text-primary">View Licenses</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
