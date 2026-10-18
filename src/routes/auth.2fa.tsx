import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  KeyRound,
  QrCode,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/auth/2fa")({
  head: () => ({
    meta: [
      { title: "Two-Factor Authentication (2FA) — Opexnal" },
      {
        name: "description",
        content:
          "Configure hardware and software two-factor authentication for your Opexnal account.",
      },
    ],
  }),
  component: TwoFactorPage,
});

function TwoFactorPage() {
  const { session, user } = useSession();
  const username = user?.username || "user_maya";

  const [step, setStep] = useState<"intro" | "setup" | "backup_codes" | "completed">("intro");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startSetup = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setBackupCodes(data.backupCodes || []);

      // Generate visual QR code
      const qrDataUrl = await QRCode.toDataURL(data.otpauthUrl, {
        margin: 2,
        width: 220,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrCodeDataUrl(qrDataUrl);
      setStep("setup");
    } catch (err) {
      setErrorMessage("Failed to initialize 2FA setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!verificationCode.trim()) {
      setErrorMessage("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "user_maya",
          token: verificationCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Invalid code from authenticator app.");
        return;
      }
      setStep("backup_codes");
      toast.success("Two-Factor Authentication successfully verified!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Two-factor verification failed.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedKey(true);
    toast.success("Secret key copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const downloadBackupCodes = () => {
    const text =
      `OPEXNAL RECOVERY BACKUP CODES\nGenerated: ${new Date().toISOString()}\nAccount: @${username}\n\n` +
      backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      "\n\nStore these single-use codes in a password manager or safe physical location.";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opexnal-backup-codes-${username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded");
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link
          to="/settings/security"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Security Settings</span>
        </Link>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center mx-auto mb-3 text-[#8B5CF6]">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Two-Factor Authentication (2FA)</h2>
        <p className="text-xs text-gray-400 font-medium">
          Add an extra layer of defense to keep unauthorized users out of your account.
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

      {/* STEP: INTRO */}
      {step === "intro" && (
        <div className="space-y-4">
          <div className="p-3.5 bg-[#121212] border border-[#262626] rounded-xl space-y-2 text-xs text-gray-300">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Smartphone className="w-4 h-4 text-[#8B5CF6]" />
              <span>Authenticator App (TOTP) Recommended</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Use Google Authenticator, Microsoft Authenticator, 1Password, or Authy. This method is
              immune to SIM-swap attacks and works without mobile network reception.
            </p>
          </div>

          <button
            type="button"
            onClick={startSetup}
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Up Authenticator App"}
          </button>
        </div>
      )}

      {/* STEP: SETUP (QR & SECRET) */}
      {step === "setup" && (
        <div className="space-y-4">
          {/* QR Code display */}
          {qrCodeDataUrl && (
            <div className="flex flex-col items-center p-4 bg-white rounded-2xl mx-auto w-fit shadow-md">
              <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-44 h-44" />
            </div>
          )}

          {/* Manual Entry Key */}
          <div className="p-3 bg-[#121212] border border-[#262626] rounded-xl space-y-1.5 text-xs">
            <span className="text-[11px] text-gray-400 font-medium">
              Or enter key manually in your app:
            </span>
            <div className="flex items-center justify-between gap-2 bg-black/60 p-2 rounded-lg border border-[#222]">
              <code className="text-[11px] font-mono text-purple-300 break-all select-all">
                {secret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="p-1.5 hover:bg-[#262626] rounded-md text-gray-400 hover:text-white transition shrink-0"
              >
                {copiedKey ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Verification input */}
          <form onSubmit={handleVerify} className="space-y-3">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400">
                <KeyRound size={18} />
              </span>
              <input
                type="text"
                placeholder="Enter 6-digit code from app"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={loading}
                autoFocus
                required
                className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition font-mono tracking-widest text-center"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code & Activate"}
            </button>
          </form>
        </div>
      )}

      {/* STEP: BACKUP CODES */}
      {step === "backup_codes" && (
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-1.5 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Save Your Backup Codes</span>
            </div>
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              If you lose your phone or authenticator access, each backup code can be used once to
              regain entry to your account.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 bg-[#121212] border border-[#262626] rounded-xl font-mono text-xs text-center text-gray-200">
            {backupCodes.map((code, idx) => (
              <div key={idx} className="p-2 bg-black/60 rounded-md border border-[#222] select-all">
                {code}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadBackupCodes}
              className="flex-1 h-10 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.txt)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join("\n"));
                toast.success("All backup codes copied");
              }}
              className="px-4 h-10 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep("completed")}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm rounded-xl transition shadow-lg"
          >
            I've Saved My Backup Codes
          </button>
        </div>
      )}

      {/* STEP: COMPLETED */}
      {step === "completed" && (
        <div className="space-y-4 text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">2FA is Now Active</h3>
            <p className="text-xs text-gray-400 mt-1">
              Your account is now protected against credential stuffing, phishing, and session
              theft.
            </p>
          </div>

          <Link
            to="/settings/security"
            className="inline-block w-full h-11 leading-[44px] bg-[#1f1f1f] hover:bg-[#262626] text-white font-semibold text-xs rounded-xl transition"
          >
            Return to Security Settings
          </Link>
        </div>
      )}
    </div>
  );
}
