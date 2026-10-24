import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Laptop,
  Smartphone,
  ShieldAlert,
  Loader2,
  Trash2,
  LogOut,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { type DeviceSessionRecord } from "@/lib/account-security";

export const Route = createFileRoute("/auth/sessions")({
  head: () => ({
    meta: [
      { title: "Active Devices & Login Sessions — Opexnal" },
      {
        name: "description",
        content: "Inspect active devices, locations, and remotely revoke sessions on Opexnal.",
      },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { session, user } = useSession();
  const token = session?.access_token || "";
  const userId = user?.id || "";

  const [sessions, setSessions] = useState<DeviceSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!userId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch("/api/auth/sessions", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (isMounted) setSessions(data.sessions || []);
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, userId]);

  const handleRevokeSingle = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      const res = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Device session revoked successfully.");
      }
    } catch {
      toast.error("Failed to revoke session.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm("Are you sure you want to log out all other devices?")) return;
    setActionLoading("all");
    try {
      const res = await fetch("/api/auth/sessions/revoke-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, keepCurrent: true }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        toast.success("All other sessions logged out.");
      }
    } catch {
      toast.error("Failed to logout all devices.");
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
          Review active devices and revoke access immediately if you see an unfamiliar login.
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
          <div className="space-y-2.5">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-3.5 bg-[#121212] border border-[#262626] rounded-xl flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#1f1f1f] text-gray-300 shrink-0 mt-0.5">
                    {s.device.toLowerCase().includes("iphone") ||
                    s.device.toLowerCase().includes("android") ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{s.device}</span>
                      {s.isCurrent && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md">
                          This Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {s.browser} • {s.os}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 pt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{s.location}</span>
                      <span>• IP: {s.ipAddress}</span>
                    </div>
                  </div>
                </div>

                {!s.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSingle(s.id)}
                    disabled={actionLoading === s.id}
                    className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition disabled:opacity-50 shrink-0"
                    title="Revoke session"
                  >
                    {actionLoading === s.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <button
              type="button"
              onClick={handleRevokeAll}
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

          <div className="p-3 bg-[#121212] border border-[#222] rounded-xl text-[11px] text-gray-400 space-y-1">
            <span className="font-semibold text-gray-300">Defense-in-depth:</span>
            <p>
              Revoking a session immediately terminates its bearer token and prevents unauthorized
              background refreshes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
