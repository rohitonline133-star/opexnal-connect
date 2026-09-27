import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Handshake, Award, Search, Sparkles } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/brand-marketplace")({
  head: () => ({
    meta: [
      { title: "Brand Collabs & Marketplace — Opexnal" },
      {
        name: "description",
        content: "Connect with verified brands for sponsorships and paid partnerships.",
      },
    ],
  }),
  component: BrandMarketplacePage,
});

function BrandMarketplacePage() {
  const navigate = useNavigate();

  const campaigns = [
    {
      id: "camp_1",
      brand: "Lumix Creative Studio",
      payout: "$500 - $1,200",
      niche: "Photography & Color Grading",
      requirement: "1 Reel + 2 Stories demonstrating raw photo workflows",
    },
    {
      id: "camp_2",
      brand: "Nordic Desk Hardware",
      payout: "$300 - $800",
      niche: "Tech & Workspace Aesthetics",
      requirement: "1 Aesthetic desk reel featuring ergonomic accessories",
    },
  ];

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Creator Collab Marketplace"
          showBack
          onBack={() => navigate({ to: "/creator" })}
        />

        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">
            Open sponsorship proposals matching your audience demographics and content niche.
          </p>

          <div className="space-y-3">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">{c.brand}</h4>
                    <span className="text-[11px] text-purple-400">{c.niche}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg">
                    {c.payout}
                  </span>
                </div>
                <p className="text-xs text-gray-300 bg-black/40 p-2.5 rounded-xl border border-[#222]">
                  {c.requirement}
                </p>
                <button
                  type="button"
                  className="w-full py-2 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold rounded-xl transition"
                >
                  View Campaign Pitch Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
