import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  ShieldAlert,
  EyeOff,
  UserX,
  Flag,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/safety")({
  head: () => ({
    meta: [
      { title: "Safety & Privacy Center — Opexnal" },
      {
        name: "description",
        content: "Community guidelines, safety tools, and moderation center.",
      },
    ],
  }),
  component: SafetyCenterPage,
});

function SafetyCenterPage() {
  const navigate = useNavigate();

  const safetyItems = [
    {
      title: "Account Status",
      desc: "Check if your account or posts have strikes or restrictions",
      route: "/account-status",
      icon: ShieldCheck,
      color: "text-emerald-400",
    },
    {
      title: "Submitted Reports & Appeals",
      desc: "Track the status of content you reported or dispute a strike",
      route: "/reports",
      icon: Flag,
      color: "text-amber-400",
    },
    {
      title: "Blocked & Restricted Accounts",
      desc: "Manage profiles that cannot interact with you",
      route: "/settings/blocked",
      icon: UserX,
      color: "text-rose-400",
    },
    {
      title: "Hidden Words & Comment Filter",
      desc: "Customize automated keyword moderation for spam & harassment",
      route: "/settings/hidden-words",
      icon: EyeOff,
      color: "text-purple-400",
    },
    {
      title: "Help & Community Guidelines",
      desc: "Read our policies on intellectual property, scams, and safety",
      route: "/help",
      icon: HelpCircle,
      color: "text-blue-400",
    },
  ];

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Safety Center" showBack onBack={() => navigate({ to: "/settings" })} />

        <div className="p-4 space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-950/40 to-black border border-[#2a2a2a] rounded-2xl space-y-1.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Opexnal Community Safety</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We empower creators with proactive safety tools, granular privacy controls, and fair
              appeal mechanisms.
            </p>
          </div>

          <div className="space-y-2">
            {safetyItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.route}
                  className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between hover:bg-[#1a1a1a] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-[#1e1e1e] ${item.color} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-400">{item.desc}</p>
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
