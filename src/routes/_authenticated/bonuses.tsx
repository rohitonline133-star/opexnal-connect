import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Award, Zap, TrendingUp } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/bonuses")({
  head: () => ({
    meta: [
      { title: "Creator Performance Bonuses — Opexnal" },
      {
        name: "description",
        content: "Earn rewards for trending, original creator reels on Opexnal.",
      },
    ],
  }),
  component: BonusesPage,
});

function BonusesPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Bonuses" showBack onBack={() => navigate({ to: "/monetization" })} />

        <div className="p-4 space-y-6">
          <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Current Cycle: September Reels Challenge</span>
            </div>
            <p className="text-xs text-gray-300">
              Reach 50,000 original reel views by Sep 30 to unlock a $100 creative grant.
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Progress: 34,200 / 50,000 views</span>
                <span className="font-semibold text-white">68%</span>
              </div>
              <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
                <div className="w-[68%] h-full bg-gradient-to-r from-[#7C3AED] to-[#D946EF]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
