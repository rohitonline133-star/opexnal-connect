import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/bonuses")({
  head: () => ({
    meta: [
      { title: "Creator Bonuses — Opexnal" },
      { name: "description", content: "Opexnal has no live bonus program or verified performance-reward ledger. No sample challenges, view counts, progress bars, or grant amounts are displayed as real rewards." },
    ],
  }),
  component: StatusPage,
});

function StatusPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black pb-20 text-white">
        <div className="mx-auto max-w-xl">
          <ScreenHeader
            title="Creator Bonuses"
            showBack
            onBack={() => navigate({ to: "/monetization" })}
          />
          <div className="space-y-4 p-4">
            <section className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">This feature is not connected yet</h2>
                <p className="text-xs leading-5 text-gray-300">
                  Opexnal has no live bonus program or verified performance-reward ledger. No sample challenges, view counts, progress bars, or grant amounts are displayed as real rewards.
                </p>
              </div>
            </section>
            <div className="rounded-xl border border-[#262626] bg-[#121212] p-4">
              <ShieldAlert className="mb-2 h-5 w-5 text-gray-400" />
              <p className="text-xs leading-5 text-gray-400">
                The feature will become available only after its backend, data storage,
                access controls, and required external services are implemented and tested.
              </p>
            </div>
            <Link
              to="/monetization"
              className="inline-flex rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black"
            >
              Back to Monetization
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
