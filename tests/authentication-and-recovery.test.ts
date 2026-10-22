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
  test("Password policy: rejects passwords under 12 characters", () => {
    const result = evaluatePasswordStrength("short1");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("12 characters")));
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
  test("OTP protection: requires a delivery provider and enforces resend cooldown", async () => {
    const unconfigured = await requestOtp("no_provider@opexnal.test", "email");
    assert.strictEqual(unconfigured.success, false);
    assert.match(unconfigured.message, /delivery is not configured/i);

    const testDestination = "tester_sim_guard@opexnal.test";
    const deliver = async (_destination: string, _type: "email" | "phone" | "recovery", _code: string) => {};
    const res1 = await requestOtp(testDestination, "email", deliver);
    assert.strictEqual(res1.success, true);
    assert.ok(res1.message.includes("Verification code sent"));

    // Immediate second attempt within cooldown must be throttled
    const res2 = await requestOtp(testDestination, "email", deliver);
    assert.strictEqual(res2.success, false);
    assert.ok(res2.message.includes("wait"));
    assert.ok(res2.cooldownRemainingMs > 0);
  });

  test("OTP protection: validates correct code and rejects invalid attempts with attempt limits", async () => {
    const testDestination = "user_otp_check@opexnal.test";
    let deliveredCode = "";
    const req = await requestOtp(testDestination, "email", async (_destination, _type, code) => {
      deliveredCode = code;
    });
    assert.strictEqual(req.success, true);
    assert.ok(deliveredCode, "delivery callback should receive the code");

    // Invalid attempt
    const invalidCheck = verifyOtp(testDestination, "000000");
    assert.strictEqual(invalidCheck.valid, false);
    assert.ok(invalidCheck.error?.includes("Invalid code"));

    // Valid check using actual generated OTP
    const validCheck = verifyOtp(testDestination, deliveredCode);
    assert.strictEqual(validCheck.valid, true);

    // Single-use: once verified, code is consumed and cannot be reused
    const reuseCheck = verifyOtp(testDestination, deliveredCode);
    assert.strictEqual(reuseCheck.valid, false);
  });

  test("OTP protection: strictly rejects backdoor codes like 123456 when actual code differs", async () => {
    const testDestination = "user_no_bypass@opexnal.test";
    let deliveredCode = "";
    const req = await requestOtp(testDestination, "email", async (_destination, _type, code) => {
      deliveredCode = code;
    });
    assert.strictEqual(req.success, true);
    if (deliveredCode !== "123456") {
      const bypassAttempt = verifyOtp(testDestination, "123456");
      assert.strictEqual(
        bypassAttempt.valid,
        false,
        "Hardcoded 123456 code must NOT bypass OTP verification",
      );
    }
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
