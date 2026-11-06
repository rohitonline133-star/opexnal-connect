import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Share2,
  Crown,
  CreditCard,
  Building2,
  FileCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Check,
  Sliders,
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
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [tierPrice, setTierPrice] = useState(settings.creatorTierPrice || 4.99);
  const [subsEnabled, setSubsEnabled] = useState(settings.creatorSubscriptionsEnabled);

  // Payout bank setup modal
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");

  const handleSaveSubscriptions = () => {
    saveSettings({
      creatorSubscriptionsEnabled: subsEnabled,
      creatorTierPrice: tierPrice,
    });
    setSettings(getStoredSettings());
    setSubModalOpen(false);
    toast.success(
      subsEnabled
        ? `Creator Subscriptions active at $${tierPrice.toFixed(2)}/month`
        : "Creator Subscriptions disabled",
    );
  };

  const handleSavePayoutDestination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !holderName) {
      toast.error("Please complete all required banking fields");
      return;
    }
    saveSettings({
      payoutDestination: {
        type: "bank",
        accountIdentifier: `•••• ${accountNumber.slice(-4)}`,
        holderName,
        verified: true,
      },
    });
    setSettings(getStoredSettings());
    setPayoutModalOpen(false);
    toast.success("Bank payout account linked successfully!");
  };

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
            {/* Creator Subscriptions */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl brand-gradient-bg flex items-center justify-center text-white">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Creator Subscriptions</p>
                    <p className="text-[11px] text-muted-foreground">
                      Offer monthly subscriber badges & exclusive posts
                    </p>
                  </div>
                </div>
                <Badge
                  variant={settings.creatorSubscriptionsEnabled ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {settings.creatorSubscriptionsEnabled ? "Active" : "Disabled"}
                </Badge>
              </div>

              {settings.creatorSubscriptionsEnabled && (
                <div className="p-3 bg-surface border border-border rounded-2xl flex justify-between items-center text-xs">
                  <span>Current Tier Price:</span>
                  <span className="font-bold text-foreground">
                    ${settings.creatorTierPrice.toFixed(2)}/month
                  </span>
                </div>
              )}

              <Button
                variant="surface"
                onClick={() => setSubModalOpen(true)}
                className="w-full text-xs h-9 rounded-xl"
              >
                Configure Subscription Tier & Pricing
              </Button>
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
          <div className="space-y-4">
            {/* Gateway Status Banner */}
            <div className="p-3.5 bg-amber-950/30 border border-amber-800/60 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Monetization Gateway Status: NOT VERIFIED</span>
              </div>
              <p className="text-amber-200/80 leading-relaxed text-[11px]">
                External Stripe Connect or payment gateway credentials are not configured in this
                environment. Payout balances, banking setups, and subscription records persist
                safely in state without charging live credit cards.
              </p>
            </div>

            {/* Earnings Balance Card */}
            <div className="p-5 bg-card border border-border rounded-3xl space-y-3 shadow-xs">
              <p className="text-xs font-semibold text-muted-foreground">Creator Balance</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-foreground">
                  ${(settings.creatorBalanceCents / 100).toFixed(2)}
                </p>
                <span className="text-xs text-muted-foreground">USD</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px]">Pending Payouts:</span>
                  <p className="font-semibold">
                    ${(settings.pendingPayoutsCents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Lifetime Earned:</span>
                  <p className="font-semibold">
                    ${(settings.lifetimeEarningsCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              <Button
                disabled={settings.creatorBalanceCents < settings.minimumPayoutThresholdCents}
                onClick={() => toast.info("Payout threshold is $50.00. Keep creating!")}
                className="w-full brand-gradient-bg text-white font-semibold rounded-xl text-xs h-10 mt-1 disabled:opacity-50"
              >
                Request Payout (Min $50.00)
              </Button>
            </div>

            {/* Payout Destination */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-5 w-5 text-primary" />
                  <p className="text-xs font-bold text-foreground">Payout Destination</p>
                </div>
                <Badge
                  variant={settings.payoutDestination.verified ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {settings.payoutDestination.verified ? "Linked" : "Not Linked"}
                </Badge>
              </div>

              {settings.payoutDestination.verified ? (
                <div className="p-3 bg-surface border border-border rounded-2xl text-xs space-y-1">
                  <p className="font-bold text-foreground">
                    Bank Account ({settings.payoutDestination.accountIdentifier})
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Account Holder: {settings.payoutDestination.holderName}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Connect your bank account or UPI ID to receive monthly automated creator payouts.
                </p>
              )}

              <Button
                variant="surface"
                onClick={() => setPayoutModalOpen(true)}
                className="w-full text-xs h-9 rounded-xl"
              >
                {settings.payoutDestination.verified ? "Change Payout Account" : "Add Bank Account"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Tier Configuration Dialog */}
      <Dialog open={subModalOpen} onOpenChange={setSubModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              Creator Subscriptions
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Set your monthly subscription price for dedicated followers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Enable Subscriptions</span>
              <Switch checked={subsEnabled} onCheckedChange={setSubsEnabled} />
            </div>

            {subsEnabled && (
              <div>
                <label className="text-xs font-semibold block mb-1">Monthly Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.50"
                    min="0.99"
                    max="99.99"
                    value={tierPrice}
                    onChange={(e) => setTierPrice(parseFloat(e.target.value) || 0)}
                    className="pl-7 h-10 rounded-xl bg-surface border-border text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="surface"
              onClick={() => setSubModalOpen(false)}
              className="flex-1 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubscriptions}
              className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
            >
              Save Tier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Account Linking Dialog */}
      <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Link Payout Destination
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Add your banking details for verified payouts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayoutDestination} className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Account Holder Legal Name</label>
              <Input
                placeholder="Full name as on bank records"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                className="h-10 rounded-xl bg-surface border-border text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Account / IBAN / Routing Number
              </label>
              <Input
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-10 rounded-xl bg-surface border-border text-xs"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="surface"
                onClick={() => setPayoutModalOpen(false)}
                className="flex-1 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
              >
                Save Bank
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
