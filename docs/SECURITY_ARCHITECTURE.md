# Opexnal Enterprise Defense-in-Depth Security Architecture

This document describes the multi-layered security engineering architecture implemented in Opexnal, adhering to publicly documented industry-standard defense-in-depth security principles.

---

## 1. Security Control Matrix & Threat Coverage

| Layer                                          | Threat Vectors Covered                                                                              | Defensive Mechanism                                                                                                                                               | Enforcement Point                                               | Fail-Safe Behavior                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Layer 1: Edge / WAF**                        | SQL Injection, XSS, Path Traversal, Command Injection, Scanner & Probe enumeration                  | Deterministic signature evaluation, scanner user-agent blocking, regex payload inspection                                                                         | `waf-engine.ts` (`src/server/security/waf-engine.ts`)           | Rejects malicious requests with `400 Bad Request` or `403 Forbidden` + security audit alert |
| **Layer 2: Multi-Dimensional Rate Limiting**   | DDoS, Credential Stuffing, Brute-Force, API abuse, Resource exhaustion                              | Multi-key sliding-window algorithm tracking IP, Account, Device Fingerprint, and sensitive routes with exponential penalty backoff                                | `rate-limiter.ts` (`src/server/security/rate-limiter.ts`)       | Returns `429 Too Many Requests` with `Retry-After` header and penalizes repeated violators  |
| **Layer 3: Behavioral Risk Analysis**          | Automated scrapers, suspicious client switches, headless browsers                                   | Composite risk scoring (0-100) analyzing IP violations, client anomalies, sensitive endpoints, and user agents                                                    | `risk-engine.ts` (`src/server/security/risk-engine.ts`)         | Demands step-up MFA/challenge at >=40 risk score; triggers automated containment at >=90    |
| **Layer 4: Server-Side 2FA / TOTP**            | Credential theft, Account takeover (ATO), Replay attacks                                            | Time-based One-Time Passwords (RFC 6238), 8 single-use cryptographically random backup recovery codes, 30s window replay protection, 5-strike brute-force lockout | `totp-server.ts` (`src/server/security/totp-server.ts`)         | Rejects replayed codes; locks 2FA for 15 minutes after 5 consecutive failures               |
| **Layer 5: Session Revocation & Containment**  | Stolen tokens, Hijacked sessions, Compromised accounts                                              | Server-side active session index, single-session revocation, "Revoke all other devices", emergency account containment                                            | `session-manager.ts` (`src/server/security/session-manager.ts`) | Instantly revokes session tokens; stops subsequent authenticated requests with `401/403`    |
| **Layer 6: Database Row Level Security (RLS)** | Unauthorized data access, Insecure Direct Object References (IDOR), Horizontal privilege escalation | Supabase PostgreSQL RLS policies checking `auth.uid()`, `can_view_post()`, `can_view_author_content()`                                                            | PostgreSQL Database Engine (`supabase/migrations/`)             | Query returns 0 rows or fails silently if user is not authorized                            |
| **Layer 7: Storage Object Access Control**     | Unauthorized media upload, Private folder exfiltration                                              | Storage bucket RLS policies restricting read/write to bucket paths matching `auth.uid()`                                                                          | Supabase Storage RLS                                            | Rejects unauthorized file uploads/downloads with 403 Forbidden                              |
| **Layer 8: HTTP Defense Headers**              | Clickjacking, MIME sniffing, Protocol downgrade, Script injection                                   | HSTS (`max-age=63072000; includeSubDomains; preload`), CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`                                      | `security-middleware.ts` & `src/server.ts`                      | Browser enforces strict sandbox and refuses malicious framing or script execution           |

---

## 2. Verification & Automated Test Results

The test suite in `scripts/verify-security.ts` executes automated tests covering all defensive vectors:

```bash
npx tsx scripts/verify-security.ts
```

### Verified Scenarios:

1. **WAF Scanner Detection**: Known attack tool User-Agents (e.g. `sqlmap`) blocked with `403 Forbidden`.
2. **WAF Probe Target Filtering**: Probes to `.env`, `wp-admin`, and configuration files blocked.
3. **Path Traversal Protection**: Directory traversal payloads (`../../../../etc/passwd`) blocked with `400 Bad Request`.
4. **Command & JNDI Injection Prevention**: Shell commands and Log4j tokens (`${jndi:ldap:...}`) rejected.
5. **SQL Injection Signature Defense**: Malicious SQL syntax (`UNION SELECT`, `1=1`, `'--`) blocked.
6. **Multi-Dimensional Rate Limiting**: Tripped upon rapid request bursts and sensitive auth routes with exponential penalty backoff.
7. **Session Lifecycle & Revocation**: Single session revocation, global "revoke others", and emergency quarantine verified.
8. **Cryptographic 2FA**: Key generation, single-use recovery backup codes, replay attack prevention, and 5-strike brute-force lockout verified.
9. **Behavioral Risk Scoring**: Scripting clients identified and flagged for elevated challenge.
10. **Audit Trail**: Security events recorded in memory ring buffer with real-time alerting.

---

## 3. Incident Response Playbook

In the event of an automated attack, token compromise, or anomaly:

1. **Identification**:
   - Monitored via `/api/security/audit-logs` and real-time security alerts.
   - High-severity events (`WAF_SQLI_BLOCKED`, `ACCOUNT_CONTAINMENT_ENGAGED`, `RATE_LIMIT_IP_EXCEEDED`) trigger alerts.
2. **Containment**:
   - Invoke `/api/security/containment` with `userId` and reason.
   - All active sessions for the user are immediately marked as revoked.
   - The account is quarantined for a designated duration (default: 120 minutes).
3. **Eradication**:
   - Attacking IP and device fingerprints are blacklisted in the rate limiter store.
   - 2FA secret rotation and single-use backup code reissuance is required.
4. **Recovery**:
   - User re-authenticates with fresh credentials, clears compromised sessions via "Revoke All Other Devices", and establishes a new session.
5. **Post-Incident Analysis**:
   - Audit logs provide an immutable timeline of IPs, User-Agents, paths, and threat categories.
