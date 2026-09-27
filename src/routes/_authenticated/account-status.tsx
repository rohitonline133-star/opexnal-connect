import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/account-status")({
  head: () => ({
    meta: [
      { title: "Account Status — Opexnal" },
      {
        name: "description",
        content: "Review your account standing, strikes, and policy compliance.",
      },
    ],
  }),
  component: AccountStatusPage,
});

function AccountStatusPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Account Status" showBack onBack={() => navigate({ to: "/safety" })} />

        <div className="p-4 space-y-6">
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your Account is in Good Standing</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Thank you for respecting the Opexnal community. You have no policy violations or
                active strikes.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Compliance Checklist
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white">Community Guidelines</span>
                <p className="text-[11px] text-emerald-400">0 violations</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white">
                  Copyright & Intellectual Property
                </span>
                <p className="text-[11px] text-emerald-400">No active claims or disputes</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white">
                  Monetization & Partner Eligibility
                </span>
                <p className="text-[11px] text-emerald-400">
                  Eligible for payouts and creator subscriptions
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
