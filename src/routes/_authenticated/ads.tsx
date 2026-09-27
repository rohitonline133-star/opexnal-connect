import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Megaphone, Plus, BarChart3, Clock, DollarSign } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/ads")({
  head: () => ({
    meta: [
      { title: "Ad Campaigns & Promotions — Opexnal" },
      {
        name: "description",
        content: "Boost posts, manage marketing campaigns and monitor ad impressions.",
      },
    ],
  }),
  component: AdsPage,
});

function AdsPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Ad Tools & Campaigns"
          showBack
          onBack={() => navigate({ to: "/creator" })}
        />

        <div className="p-4 space-y-5">
          <Link
            to="/ads/create"
            className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ad / Boost Post</span>
          </Link>

          <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Campaign Status
            </h4>
            <div className="text-center py-8 text-gray-500 text-xs space-y-1">
              <Megaphone className="w-8 h-8 mx-auto text-gray-600 mb-1" />
              <p className="font-semibold text-gray-400">No active promotions</p>
              <p className="text-[11px]">
                Boost your high-performing reels or posts to reach new audiences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
