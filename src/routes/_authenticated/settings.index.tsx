import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Lock,
  ShieldCheck,
  UserCog,
  Sparkles,
  HelpCircle,
  FileText,
  Bell,
  Moon,
  Info,
  BadgeCheck,
} from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/")({
  head: () => ({
    meta: [
      { title: "Settings & Preferences — Opexnal" },
      {
        name: "description",
        content: "Manage your Opexnal account, AI preferences, privacy and security settings.",
      },
      { property: "og:title", content: "Settings & Preferences — Opexnal" },
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
      <div className="space-y-4 px-3 sm:px-4 py-4 max-w-lg mx-auto">
        {/* Account Section */}
        <div className="space-y-1.5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Account & Profile
          </p>
          <div className="space-y-1.5">
            <SettingsLink
              to="/profile/edit"
              icon={UserCog}
              label="Edit profile"
              hint="Name, username, bio, website & avatar"
            />
            <SettingsLink
              to="/settings/privacy"
              icon={Lock}
              label="Privacy & Visibility"
              hint="Private account, mentions & tag permissions"
            />
            <SettingsLink
              to="/settings/security"
              icon={ShieldCheck}
              label="Security & Two-Factor"
              hint="Password, TOTP 2FA & audit log"
            />
          </div>
        </div>

        {/* AI & Creation Studio Section */}
        <div className="space-y-1.5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Intelligence & Tools
          </p>
          <div className="space-y-1.5">
            <Link
              to="/ai"
              className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3.5 transition-colors hover:bg-primary/10"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient-bg text-primary-foreground shadow-xs">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Opexnal AI Studio</p>
                <p className="truncate text-xs text-muted-foreground">
                  Captions, hooks, hashtags, reels ideas & Hinglish co-pilot
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-primary" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Info & Legal Section */}
        <div className="space-y-1.5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            About & Community
          </p>
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Platform Version</span>
              <span className="font-semibold text-primary">Opexnal v2.5 Production</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">AI Engine</span>
              <span className="font-medium">Google Gemini 3.7 Flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Cloud Storage & Auth</span>
              <span className="font-medium">Supabase Enterprise</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between text-[11px]">
              <Link to="/about" className="hover:underline">
                About Opexnal
              </Link>
              <Link to="/terms" className="hover:underline">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <Button
            variant="surface"
            size="xl"
            className="w-full rounded-2xl text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
            Sign out of Opexnal
          </Button>
        </div>
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
      <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
    </Link>
  );
}
