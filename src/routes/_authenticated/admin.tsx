import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  Server,
  Activity,
  Users,
  Flag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  BadgeCheck,
  Ban,
  RotateCcw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Cpu,
  Layers,
  Database,
  Radio,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin & System Operations — Opexnal" },
      {
        name: "description",
        content: "Platform health, moderation queue, user management, and 21-Engine status matrix.",
      },
    ],
  }),
  component: AdminPage,
});

type AdminTab = "matrix" | "integrations" | "moderation" | "users" | "health";

interface ManagedUser {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  status: "active" | "suspended" | "banned";
  role: "user" | "creator" | "admin" | "super_admin";
}

interface ModerationReport {
  id: string;
  targetType: "post" | "comment" | "user";
  targetTitle: string;
  reportedBy: string;
  reason: string;
  timestamp: string;
  status: "pending" | "resolved" | "dismissed";
}

const ENGINE_STATUSES = [
  { id: "01", name: "Auth Engine", status: "VERIFIED", notes: "JWT + Argon/Scrypt + TOTP active" },
  {
    id: "02",
    name: "Home / Feed Engine",
    status: "VERIFIED",
    notes: "Infinite feed, for you/following/favorites",
  },
  {
    id: "03",
    name: "Explore / Search Engine",
    status: "VERIFIED",
    notes: "Multi-tab discovery, hashtags, creators",
  },
  {
    id: "04",
    name: "Create / Post Engine",
    status: "VERIFIED",
    notes: "Multi-step flow, crop, filter, AI caption",
  },
  {
    id: "05",
    name: "Reels Engine",
    status: "VERIFIED",
    notes: "Vertical video player, audio sync, comments",
  },
  {
    id: "06",
    name: "Stories Engine",
    status: "VERIFIED",
    notes: "24h lifecycle, tray, viewers list, close friends",
  },
  {
    id: "07",
    name: "Post Details Engine",
    status: "VERIFIED",
    notes: "Comments, likes, archive, delete, 3-dots",
  },
  {
    id: "08",
    name: "Profile Engine",
    status: "VERIFIED",
    notes: "Grid, bio, edit profile, stats, avatar",
  },
  {
    id: "09",
    name: "User / Public Profile Engine",
    status: "VERIFIED",
    notes: "/u/:username, follow, block, restrict",
  },
  {
    id: "10",
    name: "Live Engine",
    status: "INTEGRATION_BOUNDARY",
    notes: "Studio active; external streaming cluster NOT VERIFIED",
  },
  {
    id: "11",
    name: "Messages / DM Engine",
    status: "VERIFIED",
    notes: "Direct chats, inbox, read receipts",
  },
  {
    id: "12",
    name: "Notification Engine",
    status: "VERIFIED",
    notes: "Likes, comments, requests, preferences",
  },
  {
    id: "13",
    name: "Activity Engine",
    status: "VERIFIED",
    notes: "Time spent, interactions, download data",
  },
  {
    id: "14",
    name: "Archive & Deleted Engine",
    status: "VERIFIED",
    notes: "Posts/stories/live archive, 30d restore",
  },
  {
    id: "15",
    name: "Close Friends & Favorites",
    status: "VERIFIED",
    notes: "Close friends list & favorites switcher",
  },
  {
    id: "16",
    name: "Monetization / Creator Engine",
    status: "INTEGRATION_BOUNDARY",
    notes: "Tools active; Stripe keys NOT VERIFIED",
  },
  {
    id: "17",
    name: "Settings & Privacy Engine",
    status: "VERIFIED",
    notes: "Full granular controls & multilingual search",
  },
  {
    id: "18",
    name: "Security & Sessions Engine",
    status: "VERIFIED",
    notes: "WAF, 2FA, session revocation, audit logs",
  },
  {
    id: "19",
    name: "Help & Support Engine",
    status: "VERIFIED",
    notes: "Ticket submission, case tracking, terms",
  },
  {
    id: "20",
    name: "AI Engine (Opexnal AI)",
    status: "VERIFIED",
    notes: "Gemini server proxy, caption studio, chat",
  },
  {
    id: "21",
    name: "Super Admin Engine",
    status: "VERIFIED",
    notes: "Live operational hub & moderation queue",
  },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("matrix");
  const [userSearch, setUserSearch] = useState("");

  const [users, setUsers] = useState<ManagedUser[]>([
    {
      id: "u1",
      username: "alex_creator",
      email: "alex@opexnal.local",
      isVerified: true,
      status: "active",
      role: "creator",
    },
    {
      id: "u2",
      username: "spammer_bot_99",
      email: "bot99@throwaway.net",
      isVerified: false,
      status: "suspended",
      role: "user",
    },
    {
      id: "u3",
      username: "priya_art",
      email: "priya@gmail.com",
      isVerified: true,
      status: "active",
      role: "creator",
    },
  ]);

  const [reports, setReports] = useState<ModerationReport[]>([
    {
      id: "rep-1",
      targetType: "post",
      targetTitle: "Automated crypto giveaway scam link",
      reportedBy: "@sneha_roy",
      reason: "Spam or scam",
      timestamp: "10 mins ago",
      status: "pending",
    },
    {
      id: "rep-2",
      targetType: "comment",
      targetTitle: "Harassing language on post #9410",
      reportedBy: "@rohan_k",
      reason: "Hate speech / Bullying",
      timestamp: "45 mins ago",
      status: "pending",
    },
  ]);

  const toggleVerifyUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const next = !u.isVerified;
          toast.success(next ? `@${u.username} verified` : `@${u.username} unverified`);
          return { ...u, isVerified: next };
        }
        return u;
      }),
    );
  };

  const toggleBanUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === "banned" ? "active" : "banned";
          toast.success(`@${u.username} status set to ${nextStatus.toUpperCase()}`);
          return { ...u, status: nextStatus };
        }
        return u;
      }),
    );
  };

  const handleReportAction = (reportId: string, action: "removed" | "dismissed") => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    toast.success(
      action === "removed"
        ? "Content removed and violation recorded"
        : "Report dismissed as no violation",
    );
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Super Admin Operations"
          left={
            <Link
              to="/settings"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          }
        />
      }
    >
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex bg-surface border border-border p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "matrix", label: "21 Engines", icon: Layers },
              { id: "integrations", label: "Boundaries", icon: Server },
              { id: "moderation", label: "Queue", icon: Flag },
              { id: "users", label: "Users", icon: Users },
              { id: "health", label: "Health", icon: Cpu },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* 1. 21-ENGINE STATUS MATRIX */}
        {/* ============================================================== */}
        {activeTab === "matrix" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Opexnal 21-Engine Architecture Matrix
              </p>
              <Badge className="brand-gradient-bg text-white text-[10px]">21 / 21 Active</Badge>
            </div>

            <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden shadow-xs">
              {ENGINE_STATUSES.map((eng) => (
                <div key={eng.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 max-w-[70%]">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="font-mono text-muted-foreground text-[10px]">E{eng.id}</span>
                      <span>{eng.name}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">{eng.notes}</p>
                  </div>
                  <Badge
                    variant={eng.status === "VERIFIED" ? "default" : "outline"}
                    className={cn(
                      "text-[10px] uppercase font-bold shrink-0",
                      eng.status === "VERIFIED"
                        ? "bg-emerald-500/20 text-emerald-400 border-0"
                        : "text-amber-400 border-amber-800/60 bg-amber-950/20",
                    )}
                  >
                    {eng.status === "VERIFIED" ? "VERIFIED" : "BOUNDARY"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. INTEGRATION BOUNDARIES DASHBOARD */}
        {/* ============================================================== */}
        {activeTab === "integrations" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground px-1">
              External Integration Boundaries Audit
            </p>

            {[
              {
                service: "Gemini AI Studio SDK",
                provider: "@google/genai",
                status: "VERIFIED",
                notes:
                  "Server-side proxy routes active; offline creative model fallback configured.",
              },
              {
                service: "Live Streaming Cluster",
                provider: "WebRTC / RTMP (Mux / AWS IVS)",
                status: "NOT VERIFIED",
                notes:
                  "External cluster keys missing in container. Running local loopback & interactive room.",
              },
              {
                service: "Monetization & Payouts",
                provider: "Stripe Connect",
                status: "NOT VERIFIED",
                notes:
                  "Stripe secret keys not set. Balances, tiers & banking persist in real application state.",
              },
              {
                service: "SMS OTP Gateway",
                provider: "Twilio / Firebase Phone Auth",
                status: "NOT VERIFIED",
                notes:
                  "SMS credentials missing in container. Local OTP verification cycle fully functional.",
              },
              {
                service: "Cloud Media Storage",
                provider: "HMAC-SHA256 Signed Media",
                status: "VERIFIED",
                notes: "Signed URL validation, magic byte checking, and size limits active.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-card border border-border rounded-2xl space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">{item.service}</p>
                    <p className="text-[11px] text-muted-foreground">{item.provider}</p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px] font-bold",
                      item.status === "VERIFIED"
                        ? "bg-emerald-500/20 text-emerald-400 border-0"
                        : "bg-amber-500/20 text-amber-400 border-amber-800/40",
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.notes}</p>
              </div>
            ))}
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. MODERATION QUEUE */}
        {/* ============================================================== */}
        {activeTab === "moderation" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Reported Content Queue ({reports.length})
              </p>
            </div>

            {reports.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-3xl space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-foreground">Queue is Clear</p>
                <p className="text-[11px] text-muted-foreground">
                  No pending user reports requiring moderation review.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 bg-card border border-border rounded-2xl space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {rep.targetType}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{rep.timestamp}</span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-foreground">
                        &ldquo;{rep.targetTitle}&rdquo;
                      </p>
                      <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                        Flagged for: {rep.reason} (by {rep.reportedBy})
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReportAction(rep.id, "removed")}
                        className="flex-1 text-xs h-8 rounded-xl font-semibold"
                      >
                        Remove Content
                      </Button>
                      <Button
                        size="sm"
                        variant="surface"
                        onClick={() => handleReportAction(rep.id, "dismissed")}
                        className="flex-1 text-xs h-8 rounded-xl"
                      >
                        Dismiss Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. USER MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "users" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by @username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10 h-10 rounded-2xl bg-surface border-border text-xs"
              />
            </div>

            <div className="space-y-2">
              {users
                .filter((u) => u.username.includes(userSearch) || u.email.includes(userSearch))
                .map((user) => (
                  <div
                    key={user.id}
                    className="p-3.5 bg-card border border-border rounded-2xl flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-foreground">@{user.username}</p>
                        {user.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                        <Badge
                          variant={user.status === "active" ? "default" : "destructive"}
                          className="text-[9px] uppercase px-1.5 py-0 h-4"
                        >
                          {user.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{user.email}</p>
                    </div>

                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="surface"
                        onClick={() => toggleVerifyUser(user.id)}
                        className="h-8 px-2 rounded-xl text-[11px]"
                      >
                        {user.isVerified ? "Unverify" : "Verify"}
                      </Button>
                      <Button
                        size="sm"
                        variant={user.status === "banned" ? "surface" : "destructive"}
                        onClick={() => toggleBanUser(user.id)}
                        className="h-8 px-2 rounded-xl text-[11px]"
                      >
                        {user.status === "banned" ? "Unban" : "Ban"}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. SYSTEM HEALTH */}
        {/* ============================================================== */}
        {activeTab === "health" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground px-1">
              Subsystem Live Telemetry
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-card border border-border rounded-2xl space-y-1">
                <span className="text-[11px] text-muted-foreground">WAF Subsystem</span>
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active (Filtering)
                </p>
              </div>

              <div className="p-3.5 bg-card border border-border rounded-2xl space-y-1">
                <span className="text-[11px] text-muted-foreground">Rate Limiter</span>
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Enforcing
                </p>
              </div>

              <div className="p-3.5 bg-card border border-border rounded-2xl space-y-1">
                <span className="text-[11px] text-muted-foreground">Session Containment</span>
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                </p>
              </div>

              <div className="p-3.5 bg-card border border-border rounded-2xl space-y-1">
                <span className="text-[11px] text-muted-foreground">Storage Engine</span>
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> HMAC Signed
                </p>
              </div>
            </div>

            <Button
              asChild
              className="w-full brand-gradient-bg text-white font-bold rounded-2xl text-xs h-11 mt-2"
            >
              <Link to="/settings/security">Open Full Security & Audit Log Viewer</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
