import React, { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { evaluatePasswordStrength, type PasswordEvaluation } from "@/lib/account-security";

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => resetPasswordSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Reset Password — Opexnal" },
      { name: "description", content: "Set a new, secure password for your Opexnal account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [codeOrToken, setCodeOrToken] = useState(search.token || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordEval: PasswordEvaluation = evaluatePasswordStrength(newPassword);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!codeOrToken.trim()) {
      setErrorMessage("Please enter your verification code or reset token.");
      return;
    }

    if (!passwordEval.isValid) {
      setErrorMessage(passwordEval.errors[0] || "Password does not meet complexity standards.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          code: codeOrToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Password reset failed. Token may be expired.");
        return;
      }

      setIsSuccess(true);
      toast.success("Password changed successfully! Previous sessions revoked.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center mx-auto mb-3 text-[#8B5CF6]">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">
          {isSuccess ? "Password Reset Complete!" : "Create New Password"}
        </h2>
        <p className="text-xs text-gray-400 font-medium">
          {isSuccess
            ? "Your account credentials have been updated and all active sessions refreshed."
            : "Your new password must be at least 8 characters and include letters, numbers & symbols."}
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="w-full mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="w-full space-y-4 text-center py-2">
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs space-y-2 text-left">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Security Hardened</span>
            </div>
            <p className="text-emerald-300 text-[11px] leading-relaxed">
              All other active login sessions on other devices have been automatically logged out to
              protect your account.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: "/auth/login", replace: true })}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm rounded-xl transition shadow-lg"
          >
            Log In with New Password
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="w-full space-y-3.5">
          {/* Reset Code or Token */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <KeyRound size={18} />
            </span>
            <input
              type="text"
              placeholder="Enter 6-digit code or reset token"
              value={codeOrToken}
              onChange={(e) => setCodeOrToken(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition font-mono"
            />
          </div>

          {/* New Password */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-11 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gray-400 hover:text-white transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Strength Bar */}
          {newPassword.length > 0 && (
            <div className="space-y-1.5 p-2.5 bg-[#121212] border border-[#222222] rounded-xl">
              <div className="flex justify-between items-center text-[11px]">
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

          {/* Confirm Password */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Reset Password & Secure Account</span>
          </button>
        </form>
      )}
    </div>
  );
}
