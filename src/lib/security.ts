/**
 * Production Security & Hardening Core Module for Opexnal
 *
 * Provides:
 * - Sliding-window rate limiters for client & server operations
 * - Input sanitization & safe URL validation (anti-XSS)
 * - Safe file extension & MIME type validators (anti-malware & path traversal)
 * - Safe audit logging helpers
 */

// --- 1. RATE LIMITING ENGINE ---

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitRecord>();

/**
 * Evaluates whether an operation from a key is within the allowed rate limit.
 * @param key Identifier (e.g., `login:email@domain.com`, `ip:1.2.3.4`, `ai:user_123`)
 * @param maxLimit Maximum allowed attempts within the window
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 minute)
 * @returns { allowed: boolean; remaining: number; retryAfterSec: number }
 */
export function checkRateLimit(
  key: string,
  maxLimit: number = 10,
  windowMs: number = 60_000,
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const record = rateLimitBuckets.get(key);

  // Clean up or initialize
  if (!record || now >= record.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxLimit - 1, retryAfterSec: 0 };
  }

  if (record.count >= maxLimit) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  record.count += 1;
  return { allowed: true, remaining: maxLimit - record.count, retryAfterSec: 0 };
}

/**
 * Resets the rate limit bucket for a key upon successful action (e.g. valid login)
 */
export function resetRateLimit(key: string): void {
  rateLimitBuckets.delete(key);
}

// Client-side persistent failed login tracker
const LOGIN_ATTEMPTS_KEY = "opexnal_sec_login_attempts";
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

const memoryLockoutStore = new Map<string, { count: number; lockedUntil?: number }>();

function getStorageItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return localStorage.getItem(key);
    } catch {
      // ignore
    }
  }
  const mem = memoryLockoutStore.get(key);
  return mem ? JSON.stringify(mem) : null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      // ignore
    }
  }
  try {
    memoryLockoutStore.set(key, JSON.parse(value));
  } catch {
    // ignore
  }
}

function removeStorageItem(key: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  memoryLockoutStore.delete(key);
}

export function getClientLoginLockout(identifier: string): {
  locked: boolean;
  remainingSec: number;
} {
  try {
    const key = `${LOGIN_ATTEMPTS_KEY}_${identifier.toLowerCase().trim()}`;
    const raw = getStorageItem(key);
    if (!raw) return { locked: false, remainingSec: 0 };
    const data = JSON.parse(raw) as { count: number; lockedUntil?: number };
    const now = Date.now();

    if (data.lockedUntil && now < data.lockedUntil) {
      return { locked: true, remainingSec: Math.ceil((data.lockedUntil - now) / 1000) };
    }
    if (data.lockedUntil && now >= data.lockedUntil) {
      removeStorageItem(key);
      return { locked: false, remainingSec: 0 };
    }
    return { locked: false, remainingSec: 0 };
  } catch {
    return { locked: false, remainingSec: 0 };
  }
}

export function recordFailedLoginAttempt(identifier: string): {
  locked: boolean;
  remainingSec: number;
} {
  const key = `${LOGIN_ATTEMPTS_KEY}_${identifier.toLowerCase().trim()}`;
  try {
    const raw = getStorageItem(key);
    const data = raw ? (JSON.parse(raw) as { count: number; lockedUntil?: number }) : { count: 0 };
    data.count += 1;

    if (data.count >= MAX_FAILED_LOGIN_ATTEMPTS) {
      const lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
      setStorageItem(key, JSON.stringify({ count: data.count, lockedUntil }));
      return { locked: true, remainingSec: Math.ceil(LOGIN_LOCKOUT_MS / 1000) };
    }

    setStorageItem(key, JSON.stringify(data));
    return { locked: false, remainingSec: 0 };
  } catch {
    return { locked: false, remainingSec: 0 };
  }
}

export function clearFailedLoginAttempts(identifier: string): void {
  try {
    removeStorageItem(`${LOGIN_ATTEMPTS_KEY}_${identifier.toLowerCase().trim()}`);
  } catch {
    // ignore
  }
}

// --- 2. INPUT SANITIZATION & SAFE URL VALIDATION (ANTI-XSS) ---

const ALLOWED_URL_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Validates whether a given URL is safe for rendering and redirection.
 * Rejects javascript:, data:, vbscript:, and relative malicious protocols.
 */
export function isSafeUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_URL_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Sanitizes any external URL string. Returns an empty string if unsafe.
 */
export function sanitizeUrl(rawUrl: string | null | undefined): string {
  if (isSafeUrl(rawUrl)) {
    return rawUrl!.trim();
  }
  return "";
}

/**
 * Strips HTML control tags and trims string input to prevent stored/reflected XSS.
 */
export function sanitizePlainText(
  input: string | null | undefined,
  maxLength: number = 2000,
): string {
  if (!input || typeof input !== "string") return "";
  return (
    input
      .replace(/<[^>]*>?/gm, "") // Strip HTML tags
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // Strip unprintable ASCII control characters
      .trim()
      .slice(0, maxLength)
  );
}

// --- 3. STORAGE & MEDIA SECURITY (ANTI-TRAVERSAL & TYPE RESTRICTION) ---

const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

/**
 * Sanitizes a file extension and maps it strictly to an allowed safe extension.
 */
export function getSafeExtension(originalFilename: string, mediaType: "image" | "video"): string {
  // Strip path characters and extract extension
  const cleanName = originalFilename.replace(/^.*[\\/]/, "");
  const parts = cleanName.split(".");
  const rawExt = parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";

  if (mediaType === "image" && ALLOWED_IMAGE_EXTENSIONS.has(rawExt)) {
    return rawExt;
  }
  if (mediaType === "video" && ALLOWED_VIDEO_EXTENSIONS.has(rawExt)) {
    return rawExt;
  }

  return mediaType === "video" ? "mp4" : "jpg";
}

/**
 * Verifies if a file object is valid according to MIME type and size limits.
 */
export function validateMediaFile(
  file: File,
  mediaType: "image" | "video",
  maxSizeBytes: number = 50 * 1024 * 1024,
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file format (${file.type}). Only standard photos (JPEG, PNG, WebP) and videos (MP4, MOV) are allowed.`,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Empty file detected." };
  }

  if (file.size > maxSizeBytes) {
    const limitMb = Math.round(maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `File size exceeds the ${limitMb}MB limit.` };
  }

  return { valid: true };
}

/**
 * Prevents directory traversal in user-specified storage paths.
 */
export function sanitizeStoragePathSegment(segment: string): string {
  return (
    segment
      .replace(/\.\./g, "")
      .replace(/[/\\]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .trim() || "default"
  );
}
