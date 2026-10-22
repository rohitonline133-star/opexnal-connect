import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, ChevronLeft, Flag, Loader2, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Operations — Opexnal" },
      { name: "description", content: "Moderation queue, account controls, and audit events." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AdminTab = "reports" | "users" | "audit";
type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

interface ModerationReport {
  id: string;
  target_type: "post" | "comment" | "user" | "story";
  target_id: string;
  target_summary: string | null;
  reporter_username: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
}

interface ManagedUser {
  id: string;
  username: string;
  email: string;
  role: "user" | "moderator" | "admin";
  is_private: boolean;
  is_deactivated: boolean;
  email_verified: boolean;
  created_at: string;
  posts_count: number;
}

interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

type ApiError = Error & { status?: number };

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(authClient.getAuthHeader());
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    const error = new Error(payload.error || "Admin request failed.") as ApiError;
    error.status = response.status;
    throw error;
  }
  return payload;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("reports");
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadTab(tab: AdminTab) {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (tab === "reports") {
        const payload = await apiRequest<{ reports?: ModerationReport[] }>("/api/v1/admin/reports?status=all");
        setReports(payload.reports || []);
      } else if (tab === "users") {
        const payload = await apiRequest<{ users?: ManagedUser[] }>("/api/v1/admin/users");
        setUsers(payload.users || []);
      } else {
        const payload = await apiRequest<{ logs?: AuditLog[] }>("/api/v1/admin/security-logs?limit=100");
        setLogs(payload.logs || []);
      }
      setAccessDenied(false);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 403 || apiError.status === 401) {
        setAccessDenied(true);
      } else {
        setErrorMessage(apiError.message || "Could not load admin data.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTab(activeTab);
  }, [activeTab]);

  async function updateReport(reportId: string, status: Exclude<ReportStatus, "pending">) {
    setActionId(reportId);
    try {
      await apiRequest<{ report: { id: string; status: ReportStatus } }>(
        `/api/v1/admin/reports/${encodeURIComponent(reportId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      setReports((previous) => previous.map((report) => report.id === reportId ? { ...report, status } : report));
      toast.success(`Report marked ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Report update failed.");
    } finally {
      setActionId(null);
    }
  }

  async function toggleUserStatus(user: ManagedUser) {
    const isDeactivated = !user.is_deactivated;
    if (!window.confirm(isDeactivated ? `Deactivate @${user.username} and revoke their sessions?` : `Reactivate @${user.username}?`)) return;
    setActionId(user.id);
    try {
      await apiRequest<{ user: ManagedUser }>(
        `/api/v1/admin/users/${encodeURIComponent(user.id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isDeactivated }),
        },
      );
      setUsers((previous) => previous.map((item) => item.id === user.id ? { ...item, is_deactivated: isDeactivated } : item));
      toast.success(isDeactivated ? "Account deactivated." : "Account reactivated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "User status update failed.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Admin Operations"
          left={
            <Link to="/settings" aria-label="Back to settings" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          }
        />
      }
    >
      <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-surface p-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Platform operations</h1>
            <p className="text-xs text-muted-foreground">Data below comes from the first-party API, not demo fixtures.</p>
          </div>
        </div>

        {accessDenied ? (
          <section className="rounded-2xl border border-border bg-surface p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
            <h2 className="font-semibold text-foreground">Administrator access required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This account does not have a moderator/admin role. No mock users, reports, or security events are shown.
            </p>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["reports", "Reports", Flag],
                ["users", "Users", Users],
                ["audit", "Audit log", Activity],
              ] as const).map(([tab, label, Icon]) => (
                <Button
                  key={tab}
                  type="button"
                  variant={activeTab === tab ? "default" : "outline"}
                  onClick={() => setActiveTab(tab)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

            {errorMessage && (
              <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeTab === "reports" ? (
              <section className="space-y-3">
                {reports.length === 0 ? (
                  <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">No reports were returned.</p>
                ) : reports.map((report) => (
                  <article key={report.id} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{report.target_type}</Badge>
                        <Badge variant={report.status === "pending" ? "destructive" : "secondary"}>{report.status}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(report.created_at)}</span>
                    </div>
                    <h3 className="font-semibold text-foreground">{report.reason}</h3>
                    <p className="text-sm text-muted-foreground">{report.target_summary || `Target ${report.target_id}`}</p>
                    <p className="text-xs text-muted-foreground">Reported by @{report.reporter_username}</p>
                    {report.details && <p className="whitespace-pre-wrap text-sm text-foreground">{report.details}</p>}
                    {report.status === "pending" && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={actionId === report.id} onClick={() => void updateReport(report.id, "reviewed")}>Mark reviewed</Button>
                        <Button size="sm" variant="destructive" disabled={actionId === report.id} onClick={() => void updateReport(report.id, "actioned")}>Action report</Button>
                        <Button size="sm" variant="ghost" disabled={actionId === report.id} onClick={() => void updateReport(report.id, "dismissed")}>Dismiss</Button>
                      </div>
                    )}
                  </article>
                ))}
              </section>
            ) : activeTab === "users" ? (
              <section className="space-y-3">
                {users.length === 0 ? (
                  <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">No users were returned.</p>
                ) : users.map((managedUser) => (
                  <article key={managedUser.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">@{managedUser.username}</p>
                      <p className="break-all text-xs text-muted-foreground">{managedUser.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {managedUser.role} · {managedUser.email_verified ? "email verified" : "email unverified"} · {managedUser.posts_count} posts
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={managedUser.is_deactivated ? "outline" : "destructive"}
                      disabled={actionId === managedUser.id || managedUser.role === "admin"}
                      onClick={() => void toggleUserStatus(managedUser)}
                    >
                      {managedUser.is_deactivated ? "Reactivate" : "Deactivate"}
                    </Button>
                  </article>
                ))}
              </section>
            ) : (
              <section className="space-y-2">
                {logs.length === 0 ? (
                  <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">No audit events were returned.</p>
                ) : logs.map((log) => (
                  <article key={log.id} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{log.action}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                    </div>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {log.target_type || "event"} {log.target_id || ""} · actor {log.actor_id || "system"}
                    </p>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
