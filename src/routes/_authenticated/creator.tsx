import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  DollarSign,
  Crown,
  AlertTriangle,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getStoredSettings, saveSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/creator")({
  head: () => ({
    meta: [
      { title: "Professional Dashboard & Creator Tools — Opexnal" },
      {
        name: "description",
        content: "Track your reach, impressions, subscriptions, earnings and payouts on Opexnal.",
      },
    ],
  }),
  component: CreatorDashboardPage,
});

type CreatorTab = "dashboard" | "tools" | "payouts";

export function CreatorDashboardPage() {
  const [activeTab, setActiveTab] = useState<CreatorTab>("dashboard");
  // Settings store integration
  const [settings, setSettings] = useState(() => getStoredSettings());

  // Subscription modal state

  // Payout bank setup modal

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Professional Dashboard"
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
        <div className="flex bg-surface border border-border p-1 rounded-2xl gap-1">
          {(
            [
              { id: "dashboard", label: "Insights", icon: BarChart3 },
              { id: "tools", label: "Creator Tools", icon: Crown },
              { id: "payouts", label: "Monetization", icon: DollarSign },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all",
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

        {/* Real analytics are not connected yet; never show fabricated metrics. */}
        {activeTab === "dashboard" && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Insights are not available yet
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Opexnal has not connected verified impression, reach, profile-visit, audience, or
              per-post analytics events to this dashboard. Metrics and performance comparisons
              will appear here only after the analytics backend is implemented and tested.
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. CREATOR TOOLS */}
        {/* ============================================================== */}
        {activeTab === "tools" && (
          <div className="space-y-3">
            {/* Creator subscriptions are unavailable until billing is connected. */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl brand-gradient-bg flex items-center justify-center text-white">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Creator Subscriptions</p>
                  <p className="text-[11px] text-muted-foreground">
                    Subscriber billing and exclusive-access enforcement are not connected yet.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Unavailable</Badge>
            </div>

            {/* Branded Content & Sponsorships */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Branded Content Tools</p>
                  <p className="text-[11px] text-muted-foreground">
                    Tag paid brand partners on posts & reels
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-2xl">
                <span className="text-xs">Paid Partnership Label</span>
                <Switch
                  checked={settings.paidPartnershipTagEnabled}
                  onCheckedChange={(checked) => {
                    saveSettings({ paidPartnershipTagEnabled: checked });
                    setSettings(getStoredSettings());
                    toast.success(
                      checked
                        ? "Paid partnership labels enabled"
                        : "Paid partnership labels disabled",
                    );
                  }}
                />
              </div>
            </div>

            {/* AI Assistant for Creators */}
            <div className="p-4 bg-card border border-border rounded-3xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Opexnal AI Studio</p>
                  <p className="text-[11px] text-muted-foreground">
                    Generate viral reels & captions
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="brand-gradient-bg text-white rounded-xl text-xs">
                <Link to="/ai">Open Studio</Link>
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. MONETIZATION & PAYOUTS */}
        {/* ============================================================== */}
        {activeTab === "payouts" && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Monetization is not connected
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              No verified payment provider, creator payout ledger, or subscription billing
              integration is connected. Opexnal will not display sample balances, collect bank
              details, or mark a payout destination as verified until those services are live.
            </p>
          </div>
        )}
      </div>


    </AppShell>
  );
}
