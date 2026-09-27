import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DollarSign, Landmark, CreditCard, History, ShieldCheck, ArrowRight } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts & Bank Settings — Opexnal" },
      {
        name: "description",
        content: "Manage payout methods, tax compliance and earnings disbursements.",
      },
    ],
  }),
  component: PayoutsPage,
});

function PayoutsPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Payouts & Banking"
          showBack
          onBack={() => navigate({ to: "/monetization" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-2">
            <span className="text-xs text-gray-400 font-medium">
              Estimated Upcoming Disbursement
            </span>
            <p className="text-3xl font-extrabold text-white">$142.50</p>
            <p className="text-[11px] text-emerald-400 font-medium">
              Scheduled for 21st of next month via direct bank deposit
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Payment Receiving Methods
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#1e1e1e] text-emerald-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Direct Bank Deposit (ACH / NEFT)</h4>
                  <p className="text-[11px] text-gray-400">HDFC Bank •••••• 4821 (Verified)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                Primary
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              to="/transactions"
              className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between hover:bg-[#1a1a1a] transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#1e1e1e] text-purple-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Transaction & Payout History</h4>
                  <p className="text-[11px] text-gray-400">
                    Detailed receipts and past monthly remittances
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
