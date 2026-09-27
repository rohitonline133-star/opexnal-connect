import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { History, Download, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions & Statements — Opexnal" },
      {
        name: "description",
        content: "Earnings history, payouts and transaction receipts on Opexnal.",
      },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const navigate = useNavigate();

  const transactions = [
    {
      id: "tx_01",
      title: "Creator Subscriptions (August)",
      date: "Sep 21, 2026",
      amount: "+$94.00",
      status: "paid",
    },
    {
      id: "tx_02",
      title: "Reels Star Gifts",
      date: "Sep 15, 2026",
      amount: "+$48.50",
      status: "paid",
    },
    {
      id: "tx_03",
      title: "Bank Remittance Direct Deposit",
      date: "Aug 21, 2026",
      amount: "-$125.00",
      status: "completed",
    },
  ];

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Transactions" showBack onBack={() => navigate({ to: "/payouts" })} />

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{tx.title}</h4>
                  <p className="text-[11px] text-gray-400">{tx.date}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-sm ${
                      tx.amount.startsWith("+") ? "text-emerald-400" : "text-gray-300"
                    }`}
                  >
                    {tx.amount}
                  </span>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
