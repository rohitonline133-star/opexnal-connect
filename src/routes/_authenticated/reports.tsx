import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Flag, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Submitted Reports & Appeals — Opexnal" },
      { name: "description", content: "Track reports, violations, and appeals on Opexnal." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const navigate = useNavigate();

  const [reports] = useState([
    {
      id: "rep_10482",
      type: "Spam & Scam Account",
      reportedUser: "crypto_doubler_bot",
      date: "Yesterday",
      status: "action_taken",
      details: "Report reviewed: account was suspended for violating financial scam policies.",
    },
    {
      id: "rep_09214",
      type: "Copyright Audio Claim",
      reportedUser: "remix_user_33",
      date: "3 days ago",
      status: "resolved",
      details: "Audio match resolved: rights holder approved commercial creator sharing.",
    },
  ]);

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Reports & Appeals"
          showBack
          onBack={() => navigate({ to: "/safety" })}
        />

        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">
            Track decisions made on reports you submitted or review pending content decisions.
          </p>

          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{r.type}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Action Taken
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Target: <strong className="text-gray-200">@{r.reportedUser}</strong> • Case #
                  {r.id}
                </p>
                <p className="text-[11px] text-gray-300 bg-black/40 p-2.5 rounded-xl border border-[#222]">
                  {r.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
