import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Crown, Users, Check, Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/subscriptions")({
  head: () => ({
    meta: [
      { title: "Creator Subscriptions — Opexnal" },
      {
        name: "description",
        content: "Offer subscriber badges, exclusive stories and subscriber-only reels.",
      },
    ],
  }),
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const navigate = useNavigate();

  const [enabled, setEnabled] = useState(true);
  const [tierPrice, setTierPrice] = useState("4.99");
  const [exclusiveStories, setExclusiveStories] = useState(true);
  const [subscriberBadge, setSubscriberBadge] = useState(true);

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Subscriptions"
          showBack
          onBack={() => navigate({ to: "/monetization" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-4 bg-gradient-to-r from-amber-950/40 to-black border border-amber-800/50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Creator Subscriptions</h4>
                <p className="text-[11px] text-gray-400">
                  Offer paid membership tiers to your dedicated community
                </p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Subscriber Perks
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Subscriber Crown Badge</span>
                <p className="text-xs text-gray-400">
                  Subscribers stand out in comments and live chat
                </p>
              </div>
              <Switch checked={subscriberBadge} onCheckedChange={setSubscriberBadge} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Exclusive Stories & Reels</span>
                <p className="text-xs text-gray-400">
                  Content accessible only by active subscribers
                </p>
              </div>
              <Switch checked={exclusiveStories} onCheckedChange={setExclusiveStories} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
