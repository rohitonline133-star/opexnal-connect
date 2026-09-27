import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Target, Users, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/ads/create")({
  head: () => ({
    meta: [
      { title: "Create Ad Campaign — Opexnal" },
      {
        name: "description",
        content: "Configure campaign goals, audience, budget and duration on Opexnal.",
      },
    ],
  }),
  component: CreateAdPage,
});

function CreateAdPage() {
  const navigate = useNavigate();

  const [goal, setGoal] = useState("profile_visits");
  const [targetAudience, setTargetAudience] = useState("automatic");
  const [dailyBudget, setDailyBudget] = useState("5");
  const [durationDays, setDurationDays] = useState("6");

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Campaign draft configured. Connect payment method in settings to activate.");
    navigate({ to: "/ads" });
  };

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Create Promotion" showBack onBack={() => navigate({ to: "/ads" })} />

        <form onSubmit={handleLaunch} className="p-4 space-y-5">
          {/* Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Campaign Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="profile_visits">More Profile Visits</option>
              <option value="website_taps">More Website / Link Taps</option>
              <option value="messages">More Direct Messages</option>
            </select>
          </div>

          {/* Audience */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Audience Targeting</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="automatic">
                Automatic (AI matches people similar to your followers)
              </option>
              <option value="local">Local Reach (Within 25km radius)</option>
              <option value="custom">Custom (Specify locations and creator interests)</option>
            </select>
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-300">Daily Budget</span>
              <span className="font-bold text-[#8B5CF6]">${dailyBudget}/day</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="w-full accent-[#8B5CF6]"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-300">Duration</span>
              <span className="font-bold text-[#8B5CF6]">{durationDays} days</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full accent-[#8B5CF6]"
            />
          </div>

          <div className="p-3 bg-[#121212] border border-[#222] rounded-xl text-xs text-gray-400 space-y-1">
            <span className="font-semibold text-gray-300">Estimated Reach:</span>
            <p className="text-[11px]">
              {(parseInt(dailyBudget, 10) * 450).toLocaleString()} –{" "}
              {(parseInt(dailyBudget, 10) * 1200).toLocaleString()} accounts over {durationDays}{" "}
              days.
            </p>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg"
          >
            Review Promotion Draft
          </button>
        </form>
      </div>
    </AppShell>
  );
}
