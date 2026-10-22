import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { authClient } from "@/lib/auth-client";
import { apiUrl } from "@/lib/api-client";

interface BlockedUser {
  id: string;
  username: string;
  display_name: string;
}

export const Route = createFileRoute("/_authenticated/settings/blocked")({
  head: () => ({
    meta: [
      { title: "Blocked Accounts — Settings — Opexnal" },
      { name: "description", content: "Review and manage blocked profiles on Opexnal." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsBlockedPage,
});

function SettingsBlockedPage() {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(apiUrl("/api/v1/users/me/blocked"), {
      headers: authClient.getAuthHeader(),
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          profiles?: BlockedUser[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || "Could not load blocked accounts.");
        if (active) setBlockedUsers(payload.profiles || []);
      })
      .catch((error) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Could not load blocked accounts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleUnblock(user: BlockedUser) {
    setActionId(user.id);
    setErrorMessage(null);
    try {
      const response = await fetch(apiUrl(`/api/v1/users/${encodeURIComponent(user.id)}/block`), {
        method: "DELETE",
        headers: authClient.getAuthHeader(),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not unblock account.");
      setBlockedUsers((previous) => previous.filter((item) => item.id !== user.id));
      toast.success(`Unblocked @${user.username}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not unblock account.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen max-w-xl mx-auto pb-20">
        <ScreenHeader title="Blocked Accounts" showBack onBack={() => navigate({ to: "/settings" })} />
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Blocked accounts cannot follow you or access your profile and posts through Opexnal. They are not notified when you block them.
          </p>
          {errorMessage && <p role="alert" className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">{errorMessage}</p>}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : blockedUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <UserCheck className="mx-auto mb-2 h-8 w-8" />
              You have not blocked any accounts.
            </div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-foreground">@{user.username}</span>
                    <p className="text-xs text-muted-foreground">{user.display_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleUnblock(user)}
                    disabled={actionId === user.id}
                    className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted/70 disabled:opacity-50"
                  >
                    {actionId === user.id ? "Working…" : "Unblock"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
