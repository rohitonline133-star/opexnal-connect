import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  User,
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Opexnal" },
      {
        name: "description",
        content: "Recover your Opexnal account password safely and securely.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!codeSent || cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown, codeSent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const target = identity.trim();
    if (!target) {
      setErrorMessage("Please enter your email, username, or phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to send reset instructions");
        toast.error(data.error || "Failed to send reset instructions");
        return;
      }
      setCodeSent(true);
      setCooldown(60);
      toast.success(data.message || "Reset instructions sent to your contact address");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset instructions";
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
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Trouble Logging In?</h2>
        <p className="text-xs text-gray-400 font-medium">
          Enter your email, username, or phone number and we'll send you a secure reset code to get
          back into your account.
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

      {codeSent ? (
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Reset Code Dispatched</p>
              <p className="text-emerald-300 text-[11px] leading-relaxed">
                If an account exists matching <strong className="text-white">{identity}</strong>, a
                one-time verification link and code has been dispatched.
              </p>
            </div>
          </div>

          <Link
            to="/auth/reset-password"
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            Enter Code & Reset Password
          </Link>

          <div className="flex justify-between items-center text-xs pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={cooldown > 0 || loading}
              className="text-[#8B5CF6] font-semibold hover:underline disabled:text-gray-500 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
            </button>

            <Link to="/auth/recovery" className="text-gray-400 hover:text-white transition">
              Can't access your email/phone?
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <User size={18} />
            </span>
            <input
              type="text"
              placeholder="Email, username, or phone number"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              disabled={loading}
              autoFocus
              required
              className="w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Login Link & Code"}
          </button>

          <div className="p-3 bg-[#121212] border border-[#222222] rounded-xl flex items-start gap-2.5 text-xs text-gray-400">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              If your account was compromised or you lost access to your primary email and phone,
              submit an{" "}
              <Link to="/auth/recovery" className="text-[#8B5CF6] font-semibold hover:underline">
                Account Recovery Request
              </Link>
              .
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
