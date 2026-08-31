import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, LogOut, Lock, ShieldCheck, UserCog } from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — Opexnal" },
      {
        name: "description",
        content: "Manage your Opexnal account, privacy and security settings.",
      },
      { property: "og:title", content: "Settings — Opexnal" },
      { property: "og:description", content: "Manage your Opexnal account, privacy and security." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    try {
      localStorage.removeItem("guest_user");
      localStorage.removeItem("opexnal_guest_user");
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Settings"
          left={
            <Link
              to="/profile"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      }
    >
      <div className="space-y-2 px-4 py-4">
        <SettingsLink
          to="/profile/edit"
          icon={UserCog}
          label="Edit profile"
          hint="Name, username, photo"
        />
        <SettingsLink
          to="/settings/privacy"
          icon={Lock}
          label="Privacy"
          hint="Private account, tags and mentions"
        />
        <SettingsLink
          to="/settings/security"
          icon={ShieldCheck}
          label="Security"
          hint="Password, two-factor, activity log"
        />

        <Button variant="surface" size="xl" className="mt-6 text-destructive" onClick={signOut}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </AppShell>
  );
}

function SettingsLink({
  to,
  icon: Icon,
  label,
  hint,
}: {
  to: "/profile/edit" | "/settings/privacy" | "/settings/security";
  icon: typeof Lock;
  label: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-secondary"
    >
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
