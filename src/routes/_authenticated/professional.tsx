import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DollarSign, Award, ArrowRight, BarChart3 } from "lucide-react";
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
          <section
            aria-labelledby="insights-status"
            className="rounded-2xl border border-[#333] bg-[#121212] p-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-gray-300">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
              <h2 id="insights-status" className="text-sm font-bold">Insights & analytics</h2>
            </div>
            <p className="text-sm font-semibold text-white">Verified analytics are not available yet</p>
            <p className="text-xs leading-5 text-gray-400">
              Opexnal will show reach, profile visits, views, engagement and follower growth here
              when event tracking and account metrics are connected. We do not display sample
              numbers as real account results.
            </p>
          </section>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Creator tools
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
                  <h4 className="text-xs font-bold text-white">Monetization & payouts</h4>
                  <p className="text-[11px] text-gray-400">
                    Subscriptions, gifts and partner payouts
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
                  <h4 className="text-xs font-bold text-white">Branded content tools</h4>
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
