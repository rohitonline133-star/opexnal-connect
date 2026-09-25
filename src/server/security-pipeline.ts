/**
 * Opexnal Defense-in-Depth: Centralized Security Event Pipeline & Metrics
 *
 * Implements:
 * - Structured audit logging for all security events (JSON format)
 * - In-memory ring buffer (1,000 events) for real-time telemetry & SIEM/SOC ingestion
 * - Real-time attack & anomaly metrics counters
 * - Standard health checks (/api/health, /api/health/deep)
 */

export type SecuritySeverity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType:
    | "WAF_BLOCK"
    | "RATE_LIMIT_BLOCK"
    | "IMPOSSIBLE_TRAVEL"
    | "PROMPT_INJECTION_BLOCK"
    | "CREDENTIAL_STUFFING_BLOCKED"
    | "AUTHENTICATION_CHALLENGE"
    | "HIGH_RISK_SESSION"
    | "ORIGIN_VIOLATION"
    | "AUDIT_LOG_TAMPER_ATTEMPT";
  severity: SecuritySeverity;
  actor: {
    ip: string;
    userId?: string;
    userAgent?: string;
  };
  details: string;
  riskScore: number;
  metadata?: Record<string, unknown>;
}

export interface SecurityMetrics {
  totalProcessedRequests: number;
  totalBlockedWafAttacks: number;
  totalRateLimitHits: number;
  totalHighRiskEvents: number;
  totalImpossibleTravelEvents: number;
  totalPromptInjectionsBlocked: number;
  uptimeSeconds: number;
  startedAt: string;
}

class SecurityEventPipeline {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;
  private readonly startTime = Date.now();

  private counters = {
    totalProcessedRequests: 0,
    totalBlockedWafAttacks: 0,
    totalRateLimitHits: 0,
    totalHighRiskEvents: 0,
    totalImpossibleTravelEvents: 0,
    totalPromptInjectionsBlocked: 0,
  };

  public recordRequest(): void {
    this.counters.totalProcessedRequests += 1;
  }

  public recordEvent(event: Omit<SecurityEvent, "id" | "timestamp">): SecurityEvent {
    const fullEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    // Update metrics
    if (event.eventType === "WAF_BLOCK") this.counters.totalBlockedWafAttacks += 1;
    if (event.eventType === "RATE_LIMIT_BLOCK") this.counters.totalRateLimitHits += 1;
    if (event.eventType === "IMPOSSIBLE_TRAVEL") this.counters.totalImpossibleTravelEvents += 1;
    if (event.eventType === "PROMPT_INJECTION_BLOCK")
      this.counters.totalPromptInjectionsBlocked += 1;
    if (event.riskScore >= 70) this.counters.totalHighRiskEvents += 1;

    // Push into ring buffer
    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    // Output structured JSON log for external log forwarders (CloudWatch, Datadog, GCP Cloud Logging)
    console.warn(`[SECURITY_EVENT] ${JSON.stringify(fullEvent)}`);

    return fullEvent;
  }

  public getRecentEvents(limit: number = 50, minSeverity?: SecuritySeverity): SecurityEvent[] {
    let filtered = this.events;
    if (minSeverity) {
      const severities: SecuritySeverity[] = ["INFO", "WARN", "ERROR", "CRITICAL"];
      const minIdx = severities.indexOf(minSeverity);
      filtered = filtered.filter((e) => severities.indexOf(e.severity) >= minIdx);
    }
    return filtered.slice(0, limit);
  }

  public getMetrics(): SecurityMetrics {
    return {
      ...this.counters,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      startedAt: new Date(this.startTime).toISOString(),
    };
  }

  public clearEvents(): void {
    this.events = [];
  }
}

export const securityPipeline = new SecurityEventPipeline();
