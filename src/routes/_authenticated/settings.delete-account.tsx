import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/settings/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete Account Permanently — Settings — Opexnal" },
      { name: "description", content: "Permanently delete your Opexnal account and erase data." },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("privacy");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm permanent removal.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      await authClient.signOut();
      toast.success("Your deletion request has been submitted. 30-day grace period initiated.");
      navigate({ to: "/auth/login", replace: true });
    } catch {
      toast.error("Deletion request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Delete Account"
          showBack
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2 text-xs text-rose-200">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Permanent Deletion Notice</span>
            </div>
            <p className="text-rose-300 text-[11px] leading-relaxed">
              If you request deletion, your profile, posts, reels, stories and follower connections
              will be permanently scheduled for erasure. You have 30 days to cancel deletion by
              logging back in.
            </p>
          </div>

          <form onSubmit={handleDelete} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Why are you deleting your account?
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="privacy">Privacy concerns</option>
                <option value="distraction">Too distracting / taking a break</option>
                <option value="second_account">Created a second account</option>
                <option value="trouble_getting_started">Trouble getting started</option>
                <option value="other">Something else</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Enter Your Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password to confirm"
                className="w-full h-11 px-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Type <strong className="text-rose-400">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                required
                placeholder="DELETE"
                className="w-full h-11 px-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || confirmText !== "DELETE"}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Permanently Delete My Account</span>
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
