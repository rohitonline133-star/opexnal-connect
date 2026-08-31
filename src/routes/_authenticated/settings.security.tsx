import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/settings/security")({
  head: () => ({
    meta: [
      { title: "Security — Opexnal" },
      {
        name: "description",
        content:
          "Change your password, enable two-factor authentication and review account activity.",
      },
      { property: "og:title", content: "Security — Opexnal" },
      {
        property: "og:description",
        content: "Password, two-factor authentication and activity log.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Security,
});

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

function Security() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");

  const factors = useQuery({
    queryKey: ["mfa-factors"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data.totp;
    },
  });

  const auditLogs = useQuery({
    queryKey: ["audit-logs", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPassword("");
    toast.success("Password updated");
  }

  async function startEnroll() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) {
      toast.error(error.message);
      return;
    }
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirmEnroll(event: React.FormEvent) {
    event.preventDefault();
    if (!enroll) return;
    setBusy(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId: enroll.id });
    if (challenge.error) {
      setBusy(false);
      toast.error(challenge.error.message);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: enroll.id,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEnroll(null);
    setCode("");
    await factors.refetch();
    toast.success("Two-factor authentication enabled");
  }

  async function removeFactor(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast.error(error.message);
      return;
    }
    await factors.refetch();
    toast.success("Two-factor authentication removed");
  }

  async function signOutEverywhere() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut({ scope: "global" });
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Security"
          left={
            <Link
              to="/settings"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      }
    >
      <div className="space-y-4 px-4 py-4">
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">Change password</h2>
          <form className="mt-3 space-y-3" onSubmit={changePassword} noValidate>
            <Label htmlFor="password" className="sr-only">
              New password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl bg-background"
            />
            <Button type="submit" variant="brand" size="xl" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Update password
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Two-factor authentication
          </h2>

          {factors.isLoading ? (
            <Loader2
              className="mt-3 h-4 w-4 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : factors.data?.length ? (
            <div className="mt-3 space-y-2">
              {factors.data.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Authenticator app · {factor.status}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeFactor(factor.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : enroll ? (
            <form className="mt-3 space-y-3" onSubmit={confirmEnroll}>
              <img
                src={enroll.qr}
                alt="QR code for your authenticator app"
                className="mx-auto h-40 w-40 rounded-xl bg-white p-2"
              />
              <p className="break-all text-center text-xs text-muted-foreground">{enroll.secret}</p>
              <Label htmlFor="totp" className="sr-only">
                Six-digit code
              </Label>
              <Input
                id="totp"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 rounded-xl bg-background text-center tracking-[0.4em]"
              />
              <Button type="submit" variant="brand" size="xl" disabled={busy}>
                Verify and enable
              </Button>
            </form>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a second step at login using an authenticator app.
              </p>
              <Button className="mt-3 rounded-xl" variant="surface" onClick={startEnroll}>
                Set up
              </Button>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">Recent account activity</h2>
          {auditLogs.isLoading ? (
            <Loader2
              className="mt-3 h-4 w-4 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : auditLogs.data?.length ? (
            <ul className="mt-3 space-y-2">
              {auditLogs.data.map((log) => (
                <li key={log.id} className="flex justify-between gap-3 text-xs">
                  <span className="truncate">{log.action.replace(/_/g, " ")}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">No recorded activity yet.</p>
          )}
        </section>

        <Button
          variant="surface"
          size="xl"
          className="text-destructive"
          onClick={signOutEverywhere}
        >
          Log out of all devices
        </Button>
      </div>
    </AppShell>
  );
}
