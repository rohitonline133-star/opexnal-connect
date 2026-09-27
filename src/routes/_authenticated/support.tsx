import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HelpCircle, Shield, Bug, FileText, ArrowRight, MessageSquare } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Opexnal Support — Help Center" },
      {
        name: "description",
        content: "Get direct support, security recovery, and troubleshooting on Opexnal.",
      },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const navigate = useNavigate();

  const supportOptions = [
    {
      title: "Help Center & FAQs",
      desc: "Guides on account settings, stories, reels, and privacy",
      route: "/help",
      icon: HelpCircle,
    },
    {
      title: "Report a Problem",
      desc: "Report technical glitches, audio errors, and app crashes",
      route: "/report-problem",
      icon: Bug,
    },
    {
      title: "Account Recovery Center",
      desc: "Restore hacked, lost or compromised accounts",
      route: "/auth/recovery",
      icon: Shield,
    },
    {
      title: "Safety & Policy Appeals",
      desc: "Track strikes, copyright claims, and decisions",
      route: "/reports",
      icon: FileText,
    },
  ];

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Support Center"
          showBack
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="p-4 space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-900/30 to-black border border-[#2a2a2a] rounded-2xl space-y-1">
            <h3 className="text-sm font-bold text-white">How can we help today?</h3>
            <p className="text-xs text-gray-400">
              Browse common troubleshooting topics or contact our safety and engineering team.
            </p>
          </div>

          <div className="space-y-2">
            {supportOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <Link
                  key={opt.title}
                  to={opt.route}
                  className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between hover:bg-[#1a1a1a] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#1e1e1e] text-[#8B5CF6] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                        {opt.title}
                      </h4>
                      <p className="text-[11px] text-gray-400">{opt.desc}</p>
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
