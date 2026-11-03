import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/account-status")({
  head: () => ({
    meta: [
      { title: "Account Status — Opexnal" },
      {
        name: "description",
        content: "Check the availability of account standing and policy compliance information.",
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

        <div className="p-4">
          <section
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-white">
                  Account status is currently unavailable
                </h2>
                <p className="text-xs leading-relaxed text-gray-300">
                  Opexnal is not currently connected to a verified account-enforcement and
                  moderation status service. We cannot confirm whether this account has policy
                  violations, copyright claims, strikes, or monetization eligibility.
                </p>
                <p className="text-xs leading-relaxed text-gray-400">
                  No compliance result is being assumed or displayed until the authoritative
                  service is available.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
