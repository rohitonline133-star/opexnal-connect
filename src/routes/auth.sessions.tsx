import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Laptop,
  Smartphone,
  Loader2,
  Trash2,
  LogOut,
  Clock,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

interface ApiDeviceSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  current: boolean;
  userAgent: string | null;
  ipAddress: string | null;
}

function getAccessToken(session: ReturnType<typeof useSession>["session"]): string {
  if (!session) return "";
  if ("token" in session && typeof session.token === "string") return session.token;
  if ("access_token" in session && typeof session.access_token === "string") return session.access_token;
  return "";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export const Route = createFileRoute("/auth/sessions")({
  head: () => ({
    meta: [
      { title: "Active Devices & Login Sessions — Opexnal" },
      {
        name: "description",
        content: "Inspect active devices and revoke sessions on Opexnal.",
      },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { session } = useSession();
  const token = getAccessToken(session);
  const [sessions, setSessions] = useState<ApiDeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!token) {
        if (isMounted) {
          setErrorMessage("Please sign in to view active sessions.");
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch("/api/v1/auth/sessions", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          sessions?: ApiDeviceSession[];
        };
        if (!res.ok) throw new Error(data.error || "Unable to load active sessions.");
        if (isMounted) {
          setSessions((data.sessions || []).filter((item) => !item.revoked));
          setErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load active sessions.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleRevokeSingle = async (sessionId: string) => {
    if (!token) return;
    setActionLoading(sessionId);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to revoke session.");
      setSessions((prev) => prev.filter((item) => item.id !== sessionId));
      toast.success("Device session revoked.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke session.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!token || !window.confirm("Log out all other devices? This device will stay signed in.")) return;
    setActionLoading("all");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v1/auth/logout-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to revoke other sessions.");
      setSessions((prev) => prev.filter((item) => item.current));
      toast.success("All other device sessions were revoked.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke other sessions.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link
          to="/settings/security"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Security Settings</span>
        </Link>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center mx-auto mb-3 text-[#8B5CF6]">
          <Laptop className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Where You're Logged In</h2>
        <p className="text-xs text-gray-400 font-medium">
          Review active sessions and revoke any device you do not recognize.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="w-full mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" />
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="rounded-xl border border-[#262626] bg-[#121212] p-4 text-center text-xs text-gray-400">
              No active sessions were returned by the server.
            </p>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((item) => {
                const userAgent = item.userAgent || "Unknown browser/device";
                const isMobile = /android|iphone|ipad|mobile/i.test(userAgent);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#121212] border border-[#262626] rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#1f1f1f] text-gray-300 shrink-0 mt-0.5">
                        {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {isMobile ? "Mobile session" : "Browser session"}
                          </span>
                          {item.current && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md">
                              This Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 break-all">{userAgent}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 pt-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>Started {formatDate(item.createdAt)}</span>
                        </div>
                        {item.ipAddress && (
                          <p className="text-[10px] text-gray-500">IP: {item.ipAddress}</p>
                        )}
                        <p className="text-[10px] text-gray-500">Expires {formatDate(item.expiresAt)}</p>
                      </div>
                    </div>

                    {!item.current && (
                      <button
                        type="button"
                        onClick={() => void handleRevokeSingle(item.id)}
                        disabled={actionLoading === item.id}
                        className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition disabled:opacity-50 shrink-0"
                        title="Revoke session"
                      >
                        {actionLoading === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {sessions.some((item) => !item.current) && (
            <button
              type="button"
              onClick={() => void handleRevokeAll()}
              disabled={actionLoading === "all"}
              className="w-full h-11 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              {actionLoading === "all" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>Log Out All Other Devices</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
