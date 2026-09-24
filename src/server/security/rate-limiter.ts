import { logSecurityEvent } from "./audit-logger";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  penaltyMs?: number | undefined;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
  retryAfterSeconds?: number | undefined;
  reason?: string | undefined;
  dimension: "IP" | "ACCOUNT" | "DEVICE" | "ACTION";
}

interface WindowBucket {
  timestamps: number[];
  blockedUntil?: number | undefined;
  violationCount: number;
}

class SlidingWindowStore {
  private buckets = new Map<string, WindowBucket>();
  private sweepInterval: NodeJS.Timeout;

  constructor() {
    // Periodic garbage collection every 60 seconds
    this.sweepInterval = setInterval(() => this.cleanup(), 60000);
    this.sweepInterval.unref?.();
  }

  public check(
    key: string,
    config: RateLimitConfig,
    dimension: "IP" | "ACCOUNT" | "DEVICE" | "ACTION",
  ): RateLimitCheckResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { timestamps: [], violationCount: 0 };
      this.buckets.set(key, bucket);
    }

    // Check if currently under penalty lock
    if (bucket.blockedUntil && bucket.blockedUntil > now) {
      const retryAfter = Math.ceil((bucket.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        limit: config.maxRequests,
        resetMs: bucket.blockedUntil - now,
        retryAfterSeconds: retryAfter,
        reason: `Violated rate limits repeatedly; penalized for ${retryAfter}s`,
        dimension,
      };
    }

    // Evict timestamps older than the sliding window
    const windowStart = now - config.windowMs;
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

    if (bucket.timestamps.length >= config.maxRequests) {
      bucket.violationCount += 1;
      const basePenalty = config.penaltyMs || config.windowMs;
      // Exponential penalty backoff based on repeat violations
      const multiplier = Math.min(Math.pow(2, bucket.violationCount - 1), 8);
      const penaltyDuration = basePenalty * multiplier;
      bucket.blockedUntil = now + penaltyDuration;

      const retryAfter = Math.ceil(penaltyDuration / 1000);
      return {
        allowed: false,
        remaining: 0,
        limit: config.maxRequests,
        resetMs: penaltyDuration,
        retryAfterSeconds: retryAfter,
        reason: `Request rate exceeded threshold (${config.maxRequests} req / ${Math.round(config.windowMs / 1000)}s)`,
        dimension,
      };
    }

    // Record this request
    bucket.timestamps.push(now);

    const oldest = bucket.timestamps[0] || now;
    const resetMs = Math.max(0, config.windowMs - (now - oldest));

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - bucket.timestamps.length),
      limit: config.maxRequests,
      resetMs,
      dimension,
    };
  }

  public reset(key: string): void {
    this.buckets.delete(key);
  }

  public clearAll(): void {
    this.buckets.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.blockedUntil && bucket.blockedUntil > now) {
        continue;
      }
      bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < 120000);
      if (bucket.timestamps.length === 0) {
        this.buckets.delete(key);
      }
    }
  }
}

// Singleton storage
export const rateLimitStore = new SlidingWindowStore();

// Pre-defined rate-limiting policies for various tiers
export const RATE_LIMIT_PROFILES = {
  // Global API default (per IP): 120 req / minute
  GLOBAL_IP: { maxRequests: 120, windowMs: 60 * 1000, penaltyMs: 15 * 1000 },
  // Sensitive endpoints (2FA, Login, Password Reset): 5 attempts / 60 seconds
  SENSITIVE_AUTH: { maxRequests: 5, windowMs: 60 * 1000, penaltyMs: 60 * 1000 },
  // Account targeted rate limit: 15 req / minute per account regardless of IP
  ACCOUNT_ACTIONS: { maxRequests: 25, windowMs: 60 * 1000, penaltyMs: 30 * 1000 },
  // Device fingerprint rate limit: 60 req / minute
  DEVICE_BURST: { maxRequests: 60, windowMs: 60 * 1000, penaltyMs: 30 * 1000 },
  // AI generation endpoint: 10 requests / minute
  AI_ENDPOINT: { maxRequests: 10, windowMs: 60 * 1000, penaltyMs: 45 * 1000 },
};

/**
 * Multi-dimensional rate limit inspector:
 * Checks IP, Account, Device, and Endpoint simultaneously.
 * If ANY dimension fails, request is denied with appropriate headers.
 */
export function checkMultiDimensionalRateLimit(params: {
  ip: string;
  userId?: string | undefined;
  fingerprint?: string | undefined;
  routeCategory: "DEFAULT" | "AUTH_SENSITIVE" | "AI";
  path: string;
}): RateLimitCheckResult {
  const { ip, userId, fingerprint, routeCategory, path } = params;

  // 1. Check IP Dimension
  const ipConfig =
    routeCategory === "AUTH_SENSITIVE"
      ? RATE_LIMIT_PROFILES.SENSITIVE_AUTH
      : routeCategory === "AI"
        ? RATE_LIMIT_PROFILES.AI_ENDPOINT
        : RATE_LIMIT_PROFILES.GLOBAL_IP;

  const ipResult = rateLimitStore.check(`ip:${ip}:${routeCategory}`, ipConfig, "IP");
  if (!ipResult.allowed) {
    logSecurityEvent({
      severity: routeCategory === "AUTH_SENSITIVE" ? "HIGH" : "MEDIUM",
      eventType: "RATE_LIMIT_IP_EXCEEDED",
      actionTaken: "RATE_LIMITED",
      ip,
      fingerprint: fingerprint || "unknown",
      path,
      method: "REQ",
      userId,
      details: { reason: ipResult.reason, retryAfterSeconds: ipResult.retryAfterSeconds },
      riskScore: 65,
    });
    return ipResult;
  }

  // 2. Check Account / User ID Dimension (Prevents distributed botnets attacking single account)
  if (userId) {
    const accountConfig =
      routeCategory === "AUTH_SENSITIVE"
        ? { maxRequests: 5, windowMs: 60 * 1000, penaltyMs: 120 * 1000 }
        : RATE_LIMIT_PROFILES.ACCOUNT_ACTIONS;

    const accountResult = rateLimitStore.check(
      `account:${userId}:${routeCategory}`,
      accountConfig,
      "ACCOUNT",
    );
    if (!accountResult.allowed) {
      logSecurityEvent({
        severity: "HIGH",
        eventType: "RATE_LIMIT_ACCOUNT_TARGETING",
        actionTaken: "RATE_LIMITED",
        ip,
        fingerprint: fingerprint || "unknown",
        path,
        method: "REQ",
        userId,
        details: {
          reason: "Excessive requests targeted at account across potentially rotating IPs",
          retryAfterSeconds: accountResult.retryAfterSeconds,
        },
        riskScore: 80,
      });
      return accountResult;
    }
  }

  // 3. Check Device Fingerprint Dimension
  if (fingerprint && fingerprint !== "unknown") {
    const deviceResult = rateLimitStore.check(
      `device:${fingerprint}`,
      RATE_LIMIT_PROFILES.DEVICE_BURST,
      "DEVICE",
    );
    if (!deviceResult.allowed) {
      logSecurityEvent({
        severity: "MEDIUM",
        eventType: "RATE_LIMIT_DEVICE_EXCEEDED",
        actionTaken: "RATE_LIMITED",
        ip,
        fingerprint,
        path,
        method: "REQ",
        userId,
        details: { retryAfterSeconds: deviceResult.retryAfterSeconds },
        riskScore: 60,
      });
      return deviceResult;
    }
  }

  return ipResult;
}
