import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TotpFactor = {
  id: string;
  status: string;
  friendly_name?: string | null;
};

export function TwoFactorSetup() {
  const [factor, setFactor] = useState<TotpFactor | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        toast.error("Could not load two-factor authentication status.");
        setLoading(false);
        return;
      }
      const verified = data?.totp?.find((item) => item.status === "verified");
      setFactor(
        verified
          ? { id: verified.id, status: verified.status, friendly_name: verified.friendly_name }
          : null,
      );
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleEnable = async () => {
    setWorking(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Opexnal authenticator",
      });
      if (error) throw error;
      setPendingFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setCode("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start two-factor setup.");
    } finally {
      setWorking(false);
    }
  };

  const handleVerify = async () => {
    if (!pendingFactorId || !code.trim()) return;
    setWorking(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: pendingFactorId,
      });
      if (challengeError) throw challengeError;
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: pendingFactorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (error) throw error;
      setFactor({
        id: data.id,
        status: "verified",
        friendly_name: "Opexnal authenticator",
      });
      setPendingFactorId("");
      setQrCode("");
      setSecret("");
      setCode("");
      toast.success("Two-factor authentication is enabled on your account.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The authenticator code could not be verified.",
      );
    } finally {
      setWorking(false);
    }
  };

  const handleDisable = async () => {
    if (!factor) return;
    setWorking(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) throw error;
      setFactor(null);
      toast.success("Two-factor authentication has been disabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disable two-factor authentication.");
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground" role="status">Checking account security…</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      {factor ? (
        <>
          <p className="text-sm font-semibold text-emerald-600" role="status">
            Two-factor authentication is enabled on this account.
          </p>
          <p className="text-xs text-muted-foreground">
            Sign-in verification is managed by your authenticated Opexnal account provider.
          </p>
          <button
            type="button"
            onClick={() => void handleDisable()}
            disabled={working}
            className="min-h-11 rounded-xl border border-destructive/40 px-4 text-sm font-semibold text-destructive disabled:opacity-50"
          >
            {working ? "Please wait…" : "Turn off two-factor authentication"}
          </button>
        </>
      ) : pendingFactorId && qrCode ? (
        <>
          <p className="text-sm font-semibold">Scan this QR code with your authenticator app.</p>
          <img src={qrCode} alt="Authenticator setup QR code" className="h-48 w-48 rounded-lg bg-white p-2" />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Manual setup key</p>
            <code className="block break-all rounded-lg bg-muted p-3 text-xs">{secret}</code>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">6-digit authenticator code</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\\D/g, "").slice(0, 6))}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base tracking-widest"
              placeholder="000000"
            />
          </label>
          <button
            type="button"
            onClick={() => void handleVerify()}
            disabled={working || code.length !== 6}
            className="min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {working ? "Verifying…" : "Verify and enable"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingFactorId("");
              setQrCode("");
              setSecret("");
              setCode("");
            }}
            disabled={working}
            className="min-h-11 w-full rounded-xl border border-border px-4 text-sm"
          >
            Cancel setup
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Add an authenticator app as a second sign-in factor. It becomes active only after the
            provider verifies a current code.
          </p>
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={working}
            className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {working ? "Starting setup…" : "Set up two-factor authentication"}
          </button>
        </>
      )}
    </div>
  );
}
