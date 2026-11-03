import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/account-status")({
  head: () => ({
    meta: [
      { title: "Account Status — Opexnal" },
      {
        name: "description",
        content: "Check the availability of verified account status information.",
      },
    ],
  }),
  component: AccountStatusPage,
});

function AccountStatusPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen max-w-xl mx-auto bg-black pb-20 text-white">
        <ScreenHeader title="Account Status" showBack onBack={() => navigate({ to: "/safety" })} />

        <div className="p-4">
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 shrink-0 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Account status unavailable</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Opexnal is not currently connected to a verified moderation and policy-status service.
              Your violations, strikes, copyright claims, and monetization eligibility cannot be
              confirmed here.
            </p>
            <p className="mt-3 text-xs leading-5 text-gray-400">
              This page will show account status only when verified data is available. No
              clean-standing or eligibility result is being assumed.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
