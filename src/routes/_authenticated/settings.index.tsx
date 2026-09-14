import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { UserCog, Lock, ShieldCheck, Sparkles, ChevronRight, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/")({
  head: () => ({
    meta: [{ title: "Settings - Opexnal" }],
  }),
  component: SettingsIndexPage,
});

function SettingsIndexPage() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto p-4 space-y-6">
        <ScreenHeader title="Settings" />

        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Account & Profile
          </h2>

          <div className="bg-card border rounded-2xl overflow-hidden divide-y divide-border">
            <Link
              to="/profile/edit"
              className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserCog className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium">Edit profile</div>
                  <div className="text-xs text-muted-foreground">
                    Name, username, bio, website & avatar
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            <Link
              to="/settings/privacy"
              className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium">Privacy & Visibility</div>
                  <div className="text-xs text-muted-foreground">
                    Private account, mentions & tag permissions
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            <Link
              to="/settings/security"
              className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium">Security & Two-Factor</div>
                  <div className="text-xs text-muted-foreground">
                    Password, TOTP 2FA & audit log
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Intelligence & Tools
          </h2>
          <div className="bg-card border rounded-2xl overflow-hidden">
            <Link
              to="/ai"
              className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium">Opexnal AI Studio</div>
                  <div className="text-xs text-muted-foreground">
                    Captions, hooks, hashtags, reels ideas & Hinglish
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-4 text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl font-medium hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out of Opexnal
        </button>
      </div>
    </AppShell>
  );
}
