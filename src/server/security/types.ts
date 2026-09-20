export type ThreatSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SecurityActionTaken =
  | "ALLOW"
  | "CHALLENGE_REQUIRED"
  | "RATE_LIMITED"
  | "BLOCKED_WAF"
  | "SESSION_REVOKED"
  | "ACCOUNT_QUARANTINED";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  severity: ThreatSeverity;
  eventType: string;
  actionTaken: SecurityActionTaken;
  userId?: string;
  ip: string;
  fingerprint: string;
  path: string;
  method: string;
  details: Record<string, unknown>;
  riskScore: number;
}

export interface SecurityRiskAssessment {
  score: number; // 0 - 100
  factors: string[];
  action: SecurityActionTaken;
  requiresMfa: boolean;
  isBlocked: boolean;
}

export interface ActiveUserSession {
  sessionId: string;
  userId: string;
  deviceFingerprint: string;
  userAgent: string;
  ip: string;
  locationEstimate?: string;
  createdAt: string;
  lastActiveAt: string;
  isRevoked: boolean;
  revocationReason?: string;
  isCurrent?: boolean;
}

export interface TwoFactorRecord {
  userId: string;
  secret: string;
  enabled: boolean;
  backupCodes: string[];
  lastUsedTimestamp?: number;
  failedAttempts: number;
  lockedUntil?: number;
  updatedAt: string;
}

export interface ReauthProof {
  userId: string;
  expiresAt: number;
  scope: string;
  signature: string;
}
