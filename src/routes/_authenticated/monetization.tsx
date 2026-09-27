import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DollarSign, Crown, Gift, Award, ArrowRight, ShieldCheck } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/monetization")({
  head: () => ({
    meta: [
      { title: "Monetization Overview — Opexnal" },
      {
        name: "description",
        content: "Review creator earnings, eligibility, and payout settings on Opexnal.",
      },
    ],
  }),
  component: MonetizationPage,
});

function MonetizationPage() {
  const navigate = useNavigate();

  const streams = [
    {
      title: "Creator Subscriptions",
      desc: "Monthly recurring revenue from VIP subscribers",
      route: "/subscriptions",
      icon: Crown,
      color: "text-amber-400",
    },
    {
      title: "Reels & Live Gifts",
      desc: "Virtual stars sent by fans during livestreams and reels",
      route: "/gifts",
      icon: Gift,
      color: "text-rose-400",
    },
    {
      title: "Creator Bonuses",
      desc: "Monthly performance rewards for original high-engagement reels",
      route: "/bonuses",
      icon: Award,
      color: "text-purple-400",
    },
    {
      title: "Payout Settings & History",
      desc: "Bank account, UPI, tax compliance and transaction history",
      route: "/payouts",
      icon: DollarSign,
      color: "text-emerald-400",
    },
  ];

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Monetization"
          showBack
          onBack={() => navigate({ to: "/professional" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 to-black border border-emerald-800/50 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white">Monetization Status: Eligible</h4>
              <p className="text-[11px] text-gray-400">
                Your profile complies with Partner Monetization Policies and community safety
                standards.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Revenue Streams
            </h3>

            {streams.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.title}
                  to={s.route}
                  className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between hover:bg-[#1a1a1a] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-[#1e1e1e] ${s.color} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                        {s.title}
                      </h4>
                      <p className="text-[11px] text-gray-400">{s.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
