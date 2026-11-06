import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";

export const Route = createFileRoute("/_authenticated/settings/security")({
  head: () => ({
    meta: [
      { title: "Security Settings - Opexnal" },
      { name: "description", content: "Manage two-factor authentication and security parameters." },
    ],
  }),
  component: SecuritySettingsPage,
});

function SecuritySettingsPage() {

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <ScreenHeader title="Account Security" />

        <div className="bg-card rounded-lg p-6 border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">Two-Factor Authentication (2FA)</h2>
          <p className="text-sm text-muted-foreground">
            TOTP-आधारित सुरक्षा सक्रिय करें। अपने Google Authenticator या Authy ऐप द्वारा अकाउंट को
            सुरक्षित करें।
          </p>

          <TwoFactorSetup />
        </div>
      </div>
    </AppShell>
  );
}
