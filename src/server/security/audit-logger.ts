import { randomUUID } from "node:crypto";
import type { SecurityEvent, ThreatSeverity, SecurityActionTaken } from "./types";

// In-memory ring buffer of the latest security events (prevents unbounded memory growth)
const MAX_EVENTS = 1000;
const eventLog: SecurityEvent[] = [];

// Listeners for real-time alerting
type AlertListener = (event: SecurityEvent) => void;
const alertListeners: Set<AlertListener> = new Set();

export function logSecurityEvent(params: {
  severity: ThreatSeverity;
  eventType: string;
  actionTaken: SecurityActionTaken;
  userId?: string;
  ip: string;
  fingerprint: string;
  path: string;
  method: string;
  details?: Record<string, unknown>;
  riskScore: number;
}): SecurityEvent {
  const event: SecurityEvent = {
    id: `sec_${Date.now()}_${randomUUID().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    severity: params.severity,
    eventType: params.eventType,
    actionTaken: params.actionTaken,
    userId: params.userId,
    ip: params.ip,
    fingerprint: params.fingerprint,
    path: params.path,
    method: params.method,
    details: params.details || {},
    riskScore: params.riskScore,
  };

  eventLog.unshift(event);
  if (eventLog.length > MAX_EVENTS) {
    eventLog.pop();
  }

  // High & Critical triggers structured alert output
  if (params.severity === "HIGH" || params.severity === "CRITICAL") {
    console.warn(
      `[SECURITY_ALERT][${params.severity}] ${params.eventType} from IP=${params.ip} Path=${params.path} Action=${params.actionTaken} Risk=${params.riskScore}`,
      JSON.stringify(event.details),
    );
  }

  for (const listener of alertListeners) {
    try {
      listener(event);
    } catch {
      // Ignore listener error to avoid disrupting flow
    }
  }

  return event;
}

export function getSecurityEvents(options?: {
  userId?: string;
  minSeverity?: ThreatSeverity;
  limit?: number;
}): SecurityEvent[] {
  const limit = options?.limit ?? 50;
  let filtered = eventLog;

  if (options?.userId) {
    filtered = filtered.filter((e) => e.userId === options.userId);
  }

  if (options?.minSeverity) {
    const ranks: Record<ThreatSeverity, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };
    const minRank = ranks[options.minSeverity];
    filtered = filtered.filter((e) => ranks[e.severity] >= minRank);
  }

  return filtered.slice(0, limit);
}

export function subscribeToSecurityAlerts(listener: AlertListener): () => void {
  alertListeners.add(listener);
  return () => alertListeners.delete(listener);
}

export function clearSecurityLogsForTesting(): void {
  eventLog.length = 0;
}
