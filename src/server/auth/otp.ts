import { randomInt } from "node:crypto";

export interface OtpRecord {
  target: string; // phone or email
  type: "phone_verification" | "password_reset" | "email_verification";
  code: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpRecord>();

// TTL: 5 minutes
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export function generateOtp(target: string, type: OtpRecord["type"]): string {
  const code = randomInt(100000, 999999).toString();
  const key = `${type}:${target.toLowerCase().trim()}`;
  otpStore.set(key, {
    target: target.toLowerCase().trim(),
    type,
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  return code;
}

export function verifyOtp(
  target: string,
  type: OtpRecord["type"],
  providedCode: string,
): { valid: boolean; message: string } {
  const key = `${type}:${target.toLowerCase().trim()}`;
  const record = otpStore.get(key);

  if (!record) {
    return { valid: false, message: "No verification code requested or code has expired" };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, message: "Verification code has expired. Please request a new code." };
  }

  record.attempts++;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { valid: false, message: "Too many failed attempts. Code has been invalidated." };
  }

  if (record.code !== providedCode.trim()) {
    return { valid: false, message: "Incorrect verification code. Please try again." };
  }

  // Once successfully verified, delete from store (single-use)
  otpStore.delete(key);
  return { valid: true, message: "Code verified successfully" };
}
