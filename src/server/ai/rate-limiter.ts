/**
 * OPEX AI Rate Limiter & Request Guard
 *
 * Implements sliding window rate limiting and payload size boundaries.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiter {
  private static store = new Map<string, RateLimitRecord>();
  private static readonly WINDOW_MS = 60 * 1000; // 1 minute window
  private static readonly MAX_USER_REQUESTS = 60; // 60 req/min for auth users
  private static readonly MAX_ANON_REQUESTS = 15; // 15 req/min for anon/ip
  public static readonly MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

  /**
   * Check rate limit for a given identifier (userId or client IP).
   */
  public static check(
    identifier: string,
    isAuthenticated = true,
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetMs: number;
  } {
    const limit = isAuthenticated ? this.MAX_USER_REQUESTS : this.MAX_ANON_REQUESTS;
    const now = Date.now();
    const cutoff = now - this.WINDOW_MS;

    let record = this.store.get(identifier);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(identifier, record);
    }

    // Filter out old timestamps
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

    if (record.timestamps.length >= limit) {
      const oldest = record.timestamps[0] || now;
      const resetMs = Math.max(0, oldest + this.WINDOW_MS - now);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetMs,
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      limit,
      remaining: limit - record.timestamps.length,
      resetMs: this.WINDOW_MS,
    };
  }

  /**
   * Reset store (useful for tests or maintenance).
   */
  public static clear(): void {
    this.store.clear();
  }
}
