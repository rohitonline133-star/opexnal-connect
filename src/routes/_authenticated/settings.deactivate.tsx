import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Power, LogOut, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/settings/deactivate")({
  head: () => ({
    meta: [
      { title: "Deactivate Account — Settings — Opexnal" },
      { name: "description", content: "Temporarily deactivate your Opexnal profile." },
    ],
  }),
  component: DeactivateAccountPage,
});

function DeactivateAccountPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please confirm your password to deactivate.");
      return;
    }
    if (
      !window.confirm(
        "Temporarily deactivate your profile? You can reactivate anytime by logging back in.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await authClient.signOut();
      toast.success("Account deactivated. You have been logged out.");
      navigate({ to: "/auth/login", replace: true });
    } catch {
      toast.error("Failed to deactivate account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Deactivate Account"
          showBack
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-2 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Deactivating is temporary</span>
            </div>
            <p className="text-amber-300 text-[11px] leading-relaxed">
              Your profile, photos, comments and likes will be hidden until you reactivate by
              logging back in. None of your data is erased.
            </p>
          </div>

          <form onSubmit={handleDeactivate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Confirm Your Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password to confirm"
                className="w-full h-11 px-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              <span>Temporarily Deactivate Account</span>
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
