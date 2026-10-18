import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { KeyRound, Mail, Phone, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const verifySearchSchema = z.object({
  contact: z.string().optional().default(""),
  type: z.enum(["email", "phone"]).optional().default("email"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/verify")({
  validateSearch: (search: Record<string, unknown>) => verifySearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Verify Contact — Opexnal" },
      { name: "description", content: "Verify your email address or phone number for Opexnal." },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [contact, setContact] = useState(search.contact);
  const [type, setType] = useState<"email" | "phone">(search.type);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    if (!contact.trim()) {
      setErrorMessage("Please provide a valid contact method.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/phone/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: contact.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to resend code");
        return;
      }
      setCooldown(60);
      toast.success(data.message || "A new verification code has been sent!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage("Please enter your 6-digit verification code");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/phone/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: contact.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Invalid verification code");
        return;
      }
      setVerified(true);
      toast.success("Contact successfully verified!");
      setTimeout(() => {
        navigate({ to: search.redirect || "/home", replace: true });
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed. Please try again.";
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
          {type === "phone" ? <Phone className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">
          {verified ? "Contact Verified!" : "Two-Step Verification"}
        </h2>
        <p className="text-xs text-gray-400 font-medium">
          {verified
            ? "Your contact method is securely confirmed."
            : `Enter the code sent to ${contact || "your registered contact"}`}
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

      {verified ? (
        <div className="text-center py-6 space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
          <p className="text-sm font-semibold text-white">Redirecting you to Opexnal...</p>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="w-full space-y-4">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">
              <KeyRound size={18} />
            </span>
            <input
              type="text"
              placeholder="6-digit verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              autoFocus
              required
              className="w-full h-12 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition font-mono tracking-widest text-center"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
          </button>

          <div className="flex justify-between items-center text-xs pt-1 px-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              className="text-[#8B5CF6] font-semibold hover:underline disabled:text-gray-500 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
            </button>

            <button
              type="button"
              onClick={() => {
                const next = type === "email" ? "phone" : "email";
                setType(next);
                setContact("");
              }}
              className="text-gray-400 hover:text-white"
            >
              Change to {type === "email" ? "Phone" : "Email"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
