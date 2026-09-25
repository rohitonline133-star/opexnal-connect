import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  DollarSign,
  Award,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  X,
  Share2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfessionalDashboardModalProps {
  username: string;
  accountType?: string;
  onClose: () => void;
  onUpdateAccountType?: (type: "personal" | "creator" | "business") => void;
}

const DAILY_REACH = [
  { day: "Mon", reach: 1200 },
  { day: "Tue", reach: 1800 },
  { day: "Wed", reach: 2400 },
  { day: "Thu", reach: 3100 },
  { day: "Fri", reach: 4800 },
  { day: "Sat", reach: 5900 },
  { day: "Sun", reach: 4200 },
];

export function ProfessionalDashboardModal({
  username,
  accountType = "creator",
  onClose,
  onUpdateAccountType,
}: ProfessionalDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<"insights" | "tools" | "monetization">("insights");
  const [currentType, setCurrentType] = useState(accountType);

  function handleSwitchType(type: "personal" | "creator" | "business") {
    setCurrentType(type);
    onUpdateAccountType?.(type);
    toast.success(`Account switched to ${type.toUpperCase()}`);
  }

  const maxReach = Math.max(...DAILY_REACH.map((d) => d.reach));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold">Professional Dashboard</h3>
              <p className="text-[11px] text-muted-foreground">@{username} · Last 30 Days</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-surface px-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("insights")}
            className={cn(
              "flex-1 py-3 border-b-2 text-center transition-colors",
              activeTab === "insights"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Insights & Reach
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tools")}
            className={cn(
              "flex-1 py-3 border-b-2 text-center transition-colors",
              activeTab === "tools"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Creator Tools
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("monetization")}
            className={cn(
              "flex-1 py-3 border-b-2 text-center transition-colors",
              activeTab === "monetization"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Monetization
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-5">
          {activeTab === "insights" && (
            <div className="space-y-4">
              {/* Stat Highlights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border bg-surface p-3 text-center">
                  <span className="text-[11px] text-muted-foreground">Accounts Reached</span>
                  <p className="mt-1 text-lg font-bold text-foreground">34.2K</p>
                  <span className="text-[10px] font-semibold text-emerald-500">+28.4%</span>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-3 text-center">
                  <span className="text-[11px] text-muted-foreground">Accounts Engaged</span>
                  <p className="mt-1 text-lg font-bold text-foreground">8.9K</p>
                  <span className="text-[10px] font-semibold text-emerald-500">+14.1%</span>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-3 text-center">
                  <span className="text-[11px] text-muted-foreground">Follower Growth</span>
                  <p className="mt-1 text-lg font-bold text-foreground">+412</p>
                  <span className="text-[10px] font-semibold text-primary">Active</span>
                </div>
              </div>

              {/* Weekly Reach Visualizer */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-semibold">Weekly Impressions Flow</span>
                  <span className="text-[11px] text-emerald-500 font-medium">Peak on Saturday</span>
                </div>
                <div className="flex items-end justify-between gap-2 h-28 pt-2">
                  {DAILY_REACH.map((item) => {
                    const heightPct = Math.round((item.reach / maxReach) * 100);
                    return (
                      <div key={item.day} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {(item.reach / 1000).toFixed(1)}k
                        </span>
                        <div className="w-full bg-secondary rounded-lg overflow-hidden flex flex-col justify-end h-20">
                          <div
                            className="w-full brand-gradient-bg rounded-lg transition-all duration-500"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {item.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Performing Formats */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <h4 className="text-xs font-semibold mb-3">Reach by Content Format</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between pb-1">
                      <span className="font-medium">Vertical Reels</span>
                      <span className="text-muted-foreground">62% (21.2K)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "62%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between pb-1">
                      <span className="font-medium">Photo Carousels</span>
                      <span className="text-muted-foreground">26% (8.9K)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: "26%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between pb-1">
                      <span className="font-medium">Single Posts & Stories</span>
                      <span className="text-muted-foreground">12% (4.1K)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "12%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tools" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <h4 className="text-xs font-semibold mb-2">Account Mode</h4>
                <div className="grid grid-cols-3 gap-2">
                  {(["personal", "creator", "business"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSwitchType(type)}
                      className={cn(
                        "rounded-xl border py-2.5 text-xs font-semibold capitalize transition-all",
                        currentType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3.5 hover:border-primary/40 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs font-semibold">Branded Content & Collabs</p>
                      <p className="text-[11px] text-muted-foreground">
                        Tag brand partners & manage sponsorship approvals
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3.5 hover:border-primary/40 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Share2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs font-semibold">Reel Templates & Audio Hub</p>
                      <p className="text-[11px] text-muted-foreground">
                        Manage your original sounds and viral template licenses
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "monetization" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Monetization Status: Eligible & Approved</span>
                </div>
                <p className="mt-1 text-xs text-emerald-300/80 leading-relaxed">
                  Your account follows Opexnal Community Standards and Partner Monetization
                  Policies.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <DollarSign className="h-4 w-4" />
                    <span>Estimated Payout</span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-foreground">$1,248.50</p>
                  <p className="text-[10px] text-muted-foreground">Next deposit: Sep 15, 2026</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs">
                    <Award className="h-4 w-4" />
                    <span>Badges & Gifts</span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-foreground">348 Badges</p>
                  <p className="text-[10px] text-muted-foreground">Earned in Live Streams</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
