import React, { useState, useEffect } from "react";
import { Shield, KeyRound, CheckCircle2, AlertTriangle, Copy, RefreshCw } from "lucide-react";

export const TwoFactorSetup = ({ userEmail }: { userEmail: string }) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [userToken, setUserToken] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    // Fetch current server 2FA status
    fetch("/api/security/2fa/status")
      .then((res) => res.json())
      .then((data) => {
        if (data?.enabled) {
          setIsVerified(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleEnable2FA = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/security/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setSecret(data.secret);
        setQrCode(data.qrCodeUrl);
        setBackupCodes(data.backupCodes || []);
      } else {
        setErrorMsg(data.message || "Failed to initialize 2FA");
      }
    } catch {
      setErrorMsg("Network error contacting security subsystem.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!userToken.trim()) {
      setErrorMsg("Please enter the 6-digit code or backup code.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/security/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: userToken }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(true);
      } else {
        setErrorMsg(data.message || "Invalid OTP code. Please try again.");
      }
    } catch {
      setErrorMsg("Error verifying code with server.");
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div
      id="two-factor-setup-container"
      className="p-5 border rounded-xl bg-card text-card-foreground shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Two-Factor Authentication (TOTP)</h3>
            <p className="text-xs text-muted-foreground">
              Server-enforced defense against credential stuffing
            </p>
          </div>
        </div>
        {isVerified && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active & Protected
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!isVerified && !qrCode && (
        <div className="pt-2">
          <button
            id="enable-2fa-btn"
            onClick={handleEnable2FA}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            Set Up Two-Factor Authentication
          </button>
        </div>
      )}

      {!isVerified && qrCode && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <p className="text-sm font-medium">1. Scan QR with Authenticator app:</p>
              <div className="inline-block p-3 bg-white rounded-xl shadow-sm border">
                <img src={qrCode} alt="2FA QR Code" className="w-44 h-44 object-contain" />
              </div>
              <div className="text-xs text-muted-foreground break-all">
                <span className="font-mono bg-muted px-2 py-1 rounded">Secret: {secret}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">2. Single-Use Emergency Recovery Codes:</p>
              <div className="p-3 bg-muted/50 rounded-lg border font-mono text-xs grid grid-cols-2 gap-1.5">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="p-1 rounded bg-background text-foreground text-center">
                    {code}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={copyBackupCodes}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedCode ? "Copied to clipboard!" : "Copy recovery codes"}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t space-y-2">
            <p className="text-sm font-medium">3. Enter the 6-digit code to activate:</p>
            <div className="flex gap-2 max-w-sm">
              <input
                id="two-factor-otp-input"
                type="text"
                maxLength={9}
                placeholder="6-digit OTP or code"
                value={userToken}
                onChange={(e) => setUserToken(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-input text-foreground border text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                id="two-factor-verify-btn"
                onClick={handleVerify}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="p-3.5 rounded-lg bg-muted/40 border text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Defense-in-depth protection enabled</p>
          <p>
            Sign-ins from unverified browsers and high-risk sessions will require your TOTP
            authenticator verification code.
          </p>
        </div>
      )}
    </div>
  );
};
