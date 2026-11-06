import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/brand-marketplace")({
  head: () => ({
    meta: [
      { title: "Brand Collaboration Marketplace — Opexnal" },
      { name: "description", content: "Verified brand onboarding, campaign inventory, contracts, and creator payment processing are not connected. No sample sponsors, offers, or payout ranges are shown as available campaigns." },
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
            title="Brand Collaboration Marketplace"
            showBack
            onBack={() => navigate({ to: "/creator" })}
          />
          <div className="space-y-4 p-4">
            <section className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">This feature is not connected yet</h2>
                <p className="text-xs leading-5 text-gray-300">
                  Verified brand onboarding, campaign inventory, contracts, and creator payment processing are not connected. No sample sponsors, offers, or payout ranges are shown as available campaigns.
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
              to="/creator"
              className="inline-flex rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black"
            >
              Back to Creator Tools
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
