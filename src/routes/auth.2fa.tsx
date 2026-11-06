import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";

export const Route = createFileRoute("/auth/2fa")({
  head: () => ({
    meta: [
      { title: "Two-Factor Authentication — Opexnal" },
      {
        name: "description",
        content: "Check authenticator-based two-factor authentication availability on Opexnal.",
      },
    ],
  }),
  component: TwoFactorPage,
});

function TwoFactorPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <ScreenHeader title="Account Security" />
        <TwoFactorSetup />
      </div>
    </AppShell>
  );
}
