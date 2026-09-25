import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OpexnalMark, OpexnalWordmark } from "@/components/opexnal/logo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Opexnal" },
      { name: "description", content: "Choose a new password for your Opexnal account." },
      { property: "og:title", content: "Set a new password — Opexnal" },
      { property: "og:description", content: "Choose a new password for your Opexnal account." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .regex(/[a-z]/, "Must include at least one lowercase letter")
  .regex(/[A-Z]/, "Must include at least one uppercase letter")
  .regex(/[0-9]/, "Must include at least one number");

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const passwordChecks = {
    hasLength: password.length >= 10,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    matches: confirm.length > 0 && password === confirm,
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid password";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    if (password !== confirm) {
      const msg = "Passwords do not match";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data });
      if (error) {
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      toast.success("Your password has been successfully updated!");
      navigate({ to: "/home", replace: true });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update password. Please try again.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-10 sm:px-6">
      {/* Background ambient lighting */}
      <div
        className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[440px]">
        {/* Header Branding */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            to="/"
            className="group inline-flex items-center gap-3 transition-transform duration-200 active:scale-95"
          >
            <OpexnalMark className="h-11 w-11 transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(168,85,247,0.4)]" />
            <OpexnalWordmark className="text-2xl" />
          </Link>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Security & Authentication
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border/80 bg-surface/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 elevated">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Set a new password
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Choose a strong, unique password to protect your Opexnal account.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive-foreground animate-in fade-in-50"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div className="flex-1 leading-relaxed text-destructive">{formError}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-medium text-muted-foreground">
                New password
              </Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="h-11 rounded-xl border-border/80 bg-secondary/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirm-password"
                className="text-xs font-medium text-muted-foreground"
              >
                Confirm new password
              </Label>
              <div className="relative">
                <ShieldCheck
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="h-11 rounded-xl border-border/80 bg-secondary/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Checklist */}
            {password.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 text-[11px] space-y-1.5">
                <p className="font-semibold text-muted-foreground">Requirements:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <RequirementRow met={passwordChecks.hasLength} label="10+ characters" />
                  <RequirementRow met={passwordChecks.hasLower} label="Lowercase letter" />
                  <RequirementRow met={passwordChecks.hasUpper} label="Uppercase letter" />
                  <RequirementRow met={passwordChecks.hasNumber} label="At least 1 number" />
                </div>
                {confirm.length > 0 && (
                  <div className="pt-1">
                    <RequirementRow met={passwordChecks.matches} label="Passwords match" />
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="brand"
                size="xl"
                className="w-full font-semibold shadow-lg shadow-primary/20"
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {busy ? "Updating password..." : "Update password"}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-border/60 text-center">
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to log in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 ${met ? "text-emerald-400" : "text-muted-foreground"}`}
    >
      {met ? (
        <Check className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 ml-1 mr-0.5" />
      )}
      <span>{label}</span>
    </div>
  );
}
