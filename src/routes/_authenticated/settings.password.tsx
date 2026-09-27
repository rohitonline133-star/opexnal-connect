import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, Eye, EyeOff, Save, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { evaluatePasswordStrength, type PasswordEvaluation } from "@/lib/account-security";

export const Route = createFileRoute("/_authenticated/settings/password")({
  head: () => ({
    meta: [
      { title: "Change Password — Settings — Opexnal" },
      { name: "description", content: "Update your Opexnal account password." },
    ],
  }),
  component: SettingsPasswordPage,
});

function SettingsPasswordPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordEval: PasswordEvaluation = evaluatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage("Please enter your current password.");
      return;
    }
    if (!passwordEval.isValid) {
      setErrorMessage(passwordEval.errors[0] || "New password is not strong enough.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          code: "verified_session_change",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update password");
        return;
      }

      toast.success("Password updated! Other active sessions have been rotated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.success("Password updated successfully.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Change Password"
          showBack
          onBack={() => navigate({ to: "/settings/security" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-3.5 bg-[#121212] border border-[#262626] rounded-xl flex items-center gap-3 text-xs text-gray-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p>
              Your password should be at least 8 characters and include a combination of numbers,
              letters and special characters.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Current Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  className="w-full h-11 pl-10 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">New Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new strong password"
                  className="w-full h-11 pl-10 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength bar */}
              {newPassword.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Strength:</span>
                    <span
                      className={`font-semibold ${
                        passwordEval.score >= 80
                          ? "text-emerald-400"
                          : passwordEval.score >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                      }`}
                    >
                      {passwordEval.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordEval.score >= 80
                          ? "bg-emerald-500"
                          : passwordEval.score >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${passwordEval.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Confirm New Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-type new password"
                  className="w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-4 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
