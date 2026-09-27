import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/professional")({
  head: () => ({
    meta: [
      { title: "Professional Dashboard — Opexnal" },
      { name: "description", content: "Professional metrics, analytics and creator growth tools." },
    ],
  }),
  component: ProfessionalDashboardPage,
});

function ProfessionalDashboardPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Professional Dashboard"
          showBack
          onBack={() => navigate({ to: "/profile" })}
        />

        <div className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-1">
              <span className="text-[11px] text-gray-400">Accounts Reached (30d)</span>
              <p className="text-xl font-bold text-white">48.2K</p>
              <span className="text-[11px] text-emerald-400 font-semibold">+14.2%</span>
            </div>
            <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-1">
              <span className="text-[11px] text-gray-400">Total Followers</span>
              <p className="text-xl font-bold text-white">12,840</p>
              <span className="text-[11px] text-emerald-400 font-semibold">+412 this week</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Creator Monetization
            </h3>

            <Link
              to="/monetization"
              className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between hover:bg-[#1a1a1a] transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Monetization & Payouts</h4>
                  <p className="text-[11px] text-gray-400">
                    Subscriptions, gifts, and partner payouts
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Link>

            <Link
              to="/branded-content"
              className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between hover:bg-[#1a1a1a] transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Branded Content Tools</h4>
                  <p className="text-[11px] text-gray-400">
                    Paid partnership tags and sponsor approvals
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
