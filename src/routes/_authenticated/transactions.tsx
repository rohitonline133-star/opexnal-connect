import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, History } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions & Statements — Opexnal" },
      {
        name: "description",
        content: "Transaction history availability on Opexnal.",
      },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black pb-20 text-white">
        <div className="mx-auto max-w-xl">
          <ScreenHeader title="Transactions" showBack onBack={() => navigate({ to: "/payouts" })} />
          <div className="space-y-4 p-4">
            <section className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">Transaction history is not connected</h2>
                <p className="text-xs leading-5 text-gray-300">
                  Opexnal has no connected billing provider or verified payout ledger.
                  No sample earnings, deposits, payment statuses, or receipts are shown
                  as real account activity.
                </p>
              </div>
            </section>
            <div className="rounded-xl border border-[#262626] bg-[#121212] p-4">
              <History className="mb-2 h-5 w-5 text-gray-400" />
              <p className="text-xs leading-5 text-gray-400">
                This page can display transaction records once payments and payouts are
                processed by a connected provider and stored in the account ledger.
              </p>
            </div>
            <Link
              to="/payouts"
              className="inline-flex rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black"
            >
              Back to Payouts
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
