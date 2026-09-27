import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DollarSign, Percent, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/affiliate")({
  head: () => ({
    meta: [
      { title: "Affiliate & Partner Program — Opexnal" },
      {
        name: "description",
        content: "Earn commissions by tagging and recommending products on Opexnal.",
      },
    ],
  }),
  component: AffiliatePage,
});

function AffiliatePage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Affiliate Program"
          showBack
          onBack={() => navigate({ to: "/creator" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 to-black border border-emerald-800/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Affiliate Account Active</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Tag partner products in your posts, reels and stories to earn up to 15% revenue share
              on qualifying purchases.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-1">
              <span className="text-[11px] text-gray-400 font-medium">Commission Rate</span>
              <p className="text-xl font-bold text-white">8% - 15%</p>
            </div>
            <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-1">
              <span className="text-[11px] text-gray-400 font-medium">Cookie Window</span>
              <p className="text-xl font-bold text-white">30 Days</p>
            </div>
          </div>

          <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-white">Branded Content Disclosure</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              In accordance with advertising transparency standards, posts containing affiliate
              links will automatically include the "Eligible for commission" badge.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
