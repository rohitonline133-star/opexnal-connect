import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePasswordStrength,
  inspectUrlForPhishing,
  requestOtp,
  verifyOtp,
  generateBackupCodes,
  generateTotpSecret,
  getSessionsForUser,
  revokeSession,
  revokeAllSessions,
  submitAccountRecoveryRequest,
  getRecoveryStatus,
} from "../src/lib/account-security.ts";

describe("Authentication & Account Security Engine", () => {
  // 1. Password Strength & Breached Password Policy
  test("Password policy: rejects passwords under 8 characters", () => {
    const result = evaluatePasswordStrength("short1");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("8 characters")));
  });

  test("Password policy: blocks common breached passwords", () => {
    const result = evaluatePasswordStrength("password123");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("data breaches")));
  });

  test("Password policy: approves high-entropy passwords with letters, numbers, and symbols", () => {
    const result = evaluatePasswordStrength("Opexnal#Secured2026!");
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
    assert.ok(result.score >= 80, `Expected score >= 80, got ${result.score}`);
    assert.strictEqual(result.label, "Very Strong");
  });

  // 2. Phishing & Lookalike Detection
  test("Phishing detection: verifies legitimate Opexnal domains", () => {
    const legit1 = inspectUrlForPhishing("https://opexnal.com/login");
    assert.strictEqual(legit1.isSuspicious, false);
    assert.strictEqual(legit1.riskLevel, "safe");

    const legit2 = inspectUrlForPhishing("http://localhost:3000/home");
    assert.strictEqual(legit2.isSuspicious, false);
    assert.strictEqual(legit2.riskLevel, "safe");
  });

  test("Phishing detection: flags lookalike/typosquatting domains", () => {
    const bad1 = inspectUrlForPhishing("https://0pexnal.com/verify-account");
    assert.strictEqual(bad1.isSuspicious, true);
    assert.strictEqual(bad1.riskLevel, "high");

    const bad2 = inspectUrlForPhishing("https://opexnal-auth.com/reset");
    assert.strictEqual(bad2.isSuspicious, true);
    assert.strictEqual(bad2.riskLevel, "high");
  });

  // 3. OTP & SIM Risk Protection
  test("OTP protection: generates code and enforces resend cooldown", () => {
    const testDestination = "tester_sim_guard@opexnal.test";
    const res1 = requestOtp(testDestination, "email");
    assert.strictEqual(res1.success, true);
    assert.ok(res1.message.includes("Verification code sent"));

    // Immediate second attempt within cooldown must be throttled
    const res2 = requestOtp(testDestination, "email");
    assert.strictEqual(res2.success, false);
    assert.ok(res2.message.includes("wait"));
    assert.ok(res2.cooldownRemainingMs > 0);
  });

  test("OTP protection: validates correct code and rejects invalid attempts with attempt limits", () => {
    const testDestination = "user_otp_check@opexnal.test";
    requestOtp(testDestination, "email");

    // Invalid attempt
    const invalidCheck = verifyOtp(testDestination, "000000");
    assert.strictEqual(invalidCheck.valid, false);
    assert.ok(invalidCheck.error?.includes("Invalid code"));

    // Fixed OTP bypasses are intentionally disabled. A guessed/default code must
    // never authenticate a user; only the cryptographically generated code is valid.
    const defaultCodeCheck = verifyOtp(testDestination, "123456");
    assert.strictEqual(defaultCodeCheck.valid, false);
    assert.ok(defaultCodeCheck.error?.includes("Invalid code"));

    // Repeated incorrect attempts must be rejected and remain bounded.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = verifyOtp(testDestination, "999999");
      assert.strictEqual(result.valid, false);
    }
    const lockedCheck = verifyOtp(testDestination, "123456");
    assert.strictEqual(lockedCheck.valid, false);
    assert.ok(lockedCheck.error?.includes("Too many failed attempts"));
  });

  // 4. Two-Factor Authentication & Backup Codes
  test("2FA engine: generates valid TOTP secret and 8 single-use backup codes", () => {
    const setup = generateTotpSecret("maya_codes");
    assert.ok(setup.secret.length >= 16);
    assert.ok(setup.otpauthUrl.startsWith("otpauth://totp/Opexnal:"));
    assert.strictEqual(setup.backupCodes.length, 8);
    for (const code of setup.backupCodes) {
      assert.match(code, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    }
  });

  // 5. Device Sessions & Remote Revocation
  test("Session management: retrieves active sessions and revokes specific session", () => {
    const testUserId = "user_device_tester";
    const initialSessions = getSessionsForUser(testUserId);
    assert.ok(initialSessions.length >= 2);

    const nonCurrentSession = initialSessions.find((s) => !s.isCurrent);
    assert.ok(nonCurrentSession, "Must have a non-current session to test revocation");

    const revoked = revokeSession(testUserId, nonCurrentSession.id);
    assert.strictEqual(revoked, true);

    const afterSessions = getSessionsForUser(testUserId);
    assert.ok(!afterSessions.some((s) => s.id === nonCurrentSession.id));
  });

  test("Session management: revokeAllSessions terminates remote sessions while preserving current", () => {
    const testUserId = "user_logout_all_tester";
    const initial = getSessionsForUser(testUserId);
    assert.ok(initial.length >= 2);

    const count = revokeAllSessions(testUserId, true);
    assert.ok(count >= 1);

    const remaining = getSessionsForUser(testUserId);
    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0]?.isCurrent, true);
  });

  // 6. Account Recovery Engine
  test("Recovery engine: files ticket, flags takeover for manual review, and provides lookup", () => {
    const submission = submitAccountRecoveryRequest({
      identityInput: "hacked_creator_account",
      reason: "account_takeover",
      contactEmail: "safe_contact@example.com",
      additionalDetails: "Attacker changed my recovery phone yesterday",
    });

    assert.strictEqual(submission.success, true);
    assert.ok(submission.ticket.id.startsWith("rec_"));
    assert.strictEqual(submission.ticket.status, "manual_review");

    // Lookup ticket
    const lookup = getRecoveryStatus(submission.ticket.id);
    assert.ok(lookup);
    assert.strictEqual(lookup.id, submission.ticket.id);
    assert.strictEqual(lookup.contactEmail, "safe_contact@example.com");
  });
});
