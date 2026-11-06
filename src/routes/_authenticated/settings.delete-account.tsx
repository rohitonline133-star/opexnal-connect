import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/settings/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete Account — Settings — Opexnal" },
      { name: "description", content: "Review account deletion availability on Opexnal." },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Delete Account"
          showBack
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="p-4 space-y-5">
          <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl space-y-2 text-xs text-amber-100">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Account deletion is not available yet</span>
            </div>
            <p className="text-amber-100/90 text-[11px] leading-relaxed">
              Opexnal does not currently provide a server-side account deletion request or a
              verified 30-day cancellation process. Your account and content will not be deleted
              from this screen.
            </p>
          </div>

          <div className="rounded-xl border border-[#262626] bg-[#121212] p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              Why this action is disabled
            </div>
            <p className="text-xs leading-relaxed text-gray-400">
              Signing out is not account deletion. This option will be enabled only after Opexnal
              has a secure, authenticated deletion endpoint, ownership confirmation, data-removal
              handling, and a working cancellation flow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: "/settings" })}
            className="w-full h-11 rounded-xl border border-[#383838] bg-[#181818] text-sm font-semibold text-white hover:bg-[#222222]"
          >
            Back to Settings
          </button>
        </div>
      </div>
    </AppShell>
  );
}
