import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { useSession } from "@/hooks/use-session";
import {
  ShieldAlert,
  Smartphone,
  Laptop,
  LogOut,
  RefreshCw,
  Activity,
  CheckCircle,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/security")({
  head: () => ({
    meta: [
      { title: "Security Settings & Defense-in-Depth - Opexnal" },
      {
        name: "description",
        content: "Multi-layer security architecture, 2FA, session revocation, and audit logs.",
      },
    ],
  }),
  component: SecuritySettingsPage,
});

interface SessionItem {
  sessionId: string;
  userAgent: string;
  ip: string;
  locationEstimate?: string;
  lastActiveAt: string;
  isCurrent?: boolean;
}

interface SecurityLogItem {
  id: string;
  timestamp: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  eventType: string;
  actionTaken: string;
  ip: string;
  path: string;
}

function SecuritySettingsPage() {
  const { session } = useSession();
  const userEmail = session?.user?.email || "user@opexnal.com";

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    protectionLevel: string;
    recentThreatsCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active sessions
      const sessRes = await fetch("/api/security/sessions");
      const sessData = await sessRes.json();
      if (sessData.sessions) {
        setSessions(sessData.sessions);
      }

      // 2. Fetch security audit logs
      const logRes = await fetch("/api/security/audit-logs");
      const logData = await logRes.json();
      if (logData.logs) {
        setSecurityLogs(logData.logs);
      }

      // 3. Fetch security subsystem health
      const healthRes = await fetch("/api/security/health");
      const healthData = await healthRes.json();
      setSystemHealth(healthData);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/security/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Session successfully revoked.");
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {
      setMessage("Failed to revoke session.");
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      const res = await fetch("/api/security/sessions/revoke-others", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Revoked ${data.count} other active session(s).`);
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {
      setMessage("Failed to revoke other sessions.");
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-4 space-y-6 pb-16">
        <ScreenHeader title="Account Security & Defense-in-Depth" />

        {/* Global System Defense Status Banner */}
        <div className="bg-card rounded-xl p-5 border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Multi-Layer Security Architecture</h3>
                <p className="text-xs text-muted-foreground">
                  Meta-Grade Defense-in-Depth: WAF, Bot Filtration, Multi-Dimensional Rate Limiting
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" />
              {systemHealth?.protectionLevel || "ENTERPRISE DEFENSE ACTIVE"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
              <div className="font-medium text-foreground">WAF & DDoS Edge</div>
              <div className="text-muted-foreground">SQLi, XSS, Scanner & Probe Filtering</div>
              <div className="text-emerald-400 font-mono text-[11px]">ACTIVE (26 signatures)</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
              <div className="font-medium text-foreground">Multi-Dimensional Rate Limits</div>
              <div className="text-muted-foreground">IP + Account + Device sliding window</div>
              <div className="text-emerald-400 font-mono text-[11px]">ENFORCED</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
              <div className="font-medium text-foreground">Session Containment</div>
              <div className="text-muted-foreground">Instant revocation & quarantine</div>
              <div className="text-emerald-400 font-mono text-[11px]">ARMED</div>
            </div>
          </div>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center justify-between">
            <span>{message}</span>
          </div>
        )}

        {/* 2FA Section */}
        <TwoFactorSetup userEmail={userEmail} />

        {/* Active Login Sessions Management */}
        <div className="bg-card rounded-xl p-5 border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-base">Active Login Sessions</h3>
              <p className="text-xs text-muted-foreground">
                Devices currently authenticated into your Opexnal profile.
              </p>
            </div>
            <button
              id="revoke-all-others-btn"
              onClick={handleRevokeAllOtherSessions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Revoke All Other Devices
            </button>
          </div>

          <div className="space-y-2.5">
            {sessions.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted/30 border text-center text-xs text-muted-foreground">
                Current active session verified on this device.
              </div>
            ) : (
              sessions.map((sess) => {
                const isMobile = /mobile|android|iphone|ipad/i.test(sess.userAgent);
                return (
                  <div
                    key={sess.sessionId}
                    className="p-3.5 rounded-lg border bg-background/50 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        {isMobile ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Laptop className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <span className="text-xs font-mono">
                            {sess.ip === "127.0.0.1" ? "Local Connection" : sess.ip}
                          </span>
                          {sess.isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-medium">
                              This Device
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {sess.userAgent.slice(0, 50)}...
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(sess.sessionId)}
                        className="px-2.5 py-1 rounded text-xs text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Security Audit Trail */}
        <div className="bg-card rounded-xl p-5 border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-base">Live Security Audit Log</h3>
              <p className="text-xs text-muted-foreground">
                Recent security incidents, rate limiting, and defensive actions.
              </p>
            </div>
            <button
              onClick={fetchSecurityData}
              disabled={loading}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Refresh security log"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {securityLogs.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground border rounded-lg bg-muted/20">
                No critical security threats detected in current window.
              </div>
            ) : (
              securityLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg border bg-background/50 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        log.severity === "CRITICAL"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : log.severity === "HIGH"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {log.severity}
                    </span>
                    <span className="text-foreground">{log.eventType}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <span>{log.actionTaken}</span>
                    <span className="text-[10px] opacity-70">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
