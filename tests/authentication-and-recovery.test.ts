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
    const deliver = async (
      _destination: string,
      _type: "email" | "phone" | "recovery",
      _code: string,
    ) => {};
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
  test("Session management: does not invent device sessions when no backend inventory exists", () => {
    const testUserId = "user_device_tester";
    assert.deepStrictEqual(getSessionsForUser(testUserId), []);
    assert.strictEqual(revokeSession(testUserId, "unknown-session"), false);
    assert.strictEqual(revokeAllSessions(testUserId, true), 0);
    assert.deepStrictEqual(getSessionsForUser(testUserId), []);
  });

});
