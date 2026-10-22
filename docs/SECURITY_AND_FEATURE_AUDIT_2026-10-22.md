# Opexnal Repository Audit — 2026-10-22

## Scope and confidence

This is a static repository review of the `main` branch, covering the auth client and routes, API request handlers, AI gateway, profile/admin routes, data adapter, tests, and initial Supabase migrations. It is **not** a live penetration test, dependency vulnerability scan, full execution of the test suite, production configuration review, or proof of exploitability. No production secrets were accessed. Findings below are based on source code visible in the repository.

## Executive summary

**Release recommendation: do not treat the current `main` branch as production-ready for real user accounts or private user data.** The most serious issues are authentication bypass/fabrication, unauthenticated account/session operations, OTP disclosure, reset flow accepting unverified requests, and client-side fake data operations presented as real features.

## Critical findings

### C-01 — Login fabricates users and tokens instead of verifying credentials
**Files:** `src/lib/auth-client.ts`; `src/routes/auth.login.tsx`; `src/routes/_authenticated/route.tsx`

The current `signInWithPassword` does not validate the password or call a trusted server. It derives a user ID from the submitted identity and creates a token-like string (`opexnal_jwt_...`). `getUser` and `getSession` trust this local state. The authenticated route accepts that local user state. This is not authentication and can make arbitrary identities appear signed in.

**Required fix:** replace the mock client with one canonical server-backed auth provider; verify passwords server-side; issue signed, expiring sessions; validate sessions on protected server routes; remove fake token formats and demo-user defaults.

### C-02 — OTP code is returned by the public request endpoint
**Files:** `src/lib/account-security.ts` (`requestOtp`); `src/server/auth-handler.ts` (`/api/auth/phone/otp/request`)

`requestOtp` generates an OTP with `Math.random()` and returns the `code` field. The handler serializes that result directly to the caller. No real email/SMS delivery is implemented in this flow. Anyone calling the endpoint can receive the code in the response.

**Required fix:** use `crypto.randomInt` or `crypto.randomBytes`; never return OTPs outside isolated test mode; deliver codes through a configured provider; store a hash with expiry and attempt limits; rate-limit by IP and destination with shared storage.

### C-03 — Password reset accepts any code/token and does not change a stored password
**File:** `src/server/auth-handler.ts` (`/api/v1/auth/password-reset/confirm`, `/api/auth/reset-password`)

The handler checks only the proposed password strength. It does not validate the submitted `code` or `token`, and it does not update a canonical user password. It records a success audit event and returns “Password reset successfully,” targeting the hard-coded `user_maya` account. The client adapter sends a constant `verified_session_reset` value.

**Required fix:** bind a random, hashed, expiring, single-use reset token to a real account; verify it server-side; atomically update the password hash; revoke that account's sessions; return generic responses to avoid account enumeration.

### C-04 — Two-factor verification checks only code format
**File:** `src/server/auth-handler.ts` (`/api/auth/2fa/verify`)

The endpoint accepts any six-digit string or a backup-code-shaped string, records an MFA audit event, and returns success. It does not verify a TOTP secret, check a backup code, or require a prior authenticated setup challenge.

**Required fix:** verify TOTP cryptographically against the enrolled user's secret, consume backup codes once, bind the challenge to the authenticated pending login, and only then issue a session.

### C-05 — Session listing/revocation and security logs lack real authorization
**File:** `src/server/auth-handler.ts`

The session endpoints infer identity from a substring in the Authorization header or fall back to `user_maya`. Revoke endpoints trust a user ID from the request body and do not authenticate ownership. `/api/auth/security-logs` returns the audit log without an authentication/role check. Recovery status is also looked up by a caller-supplied ticket ID without verifying ticket ownership.

**Required fix:** authenticate every endpoint using the canonical session verifier; derive user identity only from verified claims; enforce ownership and role checks; restrict audit logs to authorized administrators; use unguessable recovery tickets and verify ownership.

## High-severity findings

### H-01 — Server-side Supabase admin client has a hard-coded project URL and fake service-role fallback
**File:** `src/integrations/supabase/client.server.ts`

The main branch includes a fixed Supabase project URL and `mock-service-role-key` fallback and logs a warning while continuing. A fake key is not a safe fail-closed configuration and the service-role client bypasses row-level security by design.

**Required fix:** remove all fallback credentials/URLs; throw at startup or first use in production when required server-only environment variables are missing; keep service-role client in strictly trusted server modules; rotate any real credentials if they were ever committed elsewhere.

### H-02 — Admin page uses hard-coded sample users/reports and local UI state, not server authorization
**File:** `src/routes/_authenticated/admin.tsx`

The admin screen declares an in-memory sample user list, sample reports, and status-changing handlers that update React state and show success toasts. This is not a real moderation/admin system. The authenticated route is not a server-side admin-role gate.

**Required fix:** remove sample data from production screens; enforce admin roles on the server for every action; persist moderation actions with audit records; test user-to-user and user-to-admin authorization boundaries.

### H-03 — AI identity is inferred from unverified token text; AI endpoints are public
**Files:** `src/server/ai/http-handler.ts`; `src/server/ai/gateway.ts`

The AI handler extracts a user ID by parsing token strings with `opexnal_jwt_` / `opexnal_demo_` prefixes instead of verifying a signature. Requests can therefore claim an identity for rate-limit/audit attribution. Chat, creator-tools and moderation handlers do not require a verified session in the reviewed code. CORS preflight permits `*`.

**Required fix:** authenticate through the same trusted session verifier; never derive identity from token text; use rate limits keyed to verified users and trusted proxy IPs; set an explicit allowed-origin list; validate every body field and cap decoded image size.

### H-04 — Fake local database adapter reports success without durable persistence
**File:** `src/integrations/supabase/client.ts`

The adapter stores most table operations in browser `localStorage`/memory, returns success for RPC calls without executing them, uses a no-op realtime channel, and returns input paths as “signed” URLs. This can make writes appear successful without reaching a shared database and does not enforce database authorization.

**Required fix:** replace it feature-by-feature with real authenticated API/database operations; fail visibly when a feature is not implemented; do not label raw paths as signed URLs; test persistence across users, browsers and devices.

### H-05 — Current-user profile can redirect to a seeded demo profile
**File:** `src/routes/_authenticated/profile.tsx`

When the current user's profile lookup returns no username, the page redirects to `/u/maya_creates`. This is an incorrect identity fallback and can show unrelated/demo content.

**Required fix:** show an explicit profile-setup/error state or create a profile tied to the verified user; never redirect a real account to a seeded identity.

### H-06 — Frontend and independent API are not integrated as one production auth/data path
**Files:** `src/server.ts`, `src/server/auth-handler.ts`, `backend/server.js`, `src/integrations/supabase/client.ts`

The independent Express/PostgreSQL API runs as a separate process, while the TanStack server routes `/api/auth/*` and `/api/v1/*` to a different in-process handler. The reviewed client mostly calls relative URLs and the adapter's local fallback. The independent backend's JWT identity and the frontend's fabricated local tokens are incompatible.

**Required fix:** choose one canonical architecture; wire the client to the API base URL; implement API endpoints and verified sessions end-to-end; migrate each feature with regression tests; do not merge Supabase and independent JWT auth flows together.

### H-07 — Story/feed fallback endpoints ignore authenticated identity
**File:** `src/server/auth-handler.ts`

The fallback feed is returned without a verified viewer identity, and the story tray is hard-coded to `user_maya`. This is not per-user production data access.

**Required fix:** authenticate requests and derive viewer ID from verified claims; enforce privacy/follow/blocked-user rules server-side.

### H-08 — WebSocket JWT in query string on independent API
**File:** `backend/server.js` on `independent-backend-20261016`

The independent API originally accepts a bearer JWT from `/ws?token=...`, which may leak into logs and monitoring URLs. A draft PR #7 proposes short-lived single-use tickets, but it changes the handshake contract and is not yet integrated with the frontend or deployed.

**Required fix:** complete and test a short-lived single-use ticket flow end-to-end, protect ticket issuance, and use shared storage or a deliberate single-instance/sticky-routing design.

## Medium-severity findings

### M-01 — Rate limiting is process-local and trusts forwarded IP headers
**Files:** `src/server/ai/rate-limiter.ts`; `src/server/ai/http-handler.ts`; `backend/server.js`

In-memory maps do not coordinate across replicas and can grow with attacker-controlled identifiers. The AI handler trusts `X-Forwarded-For` directly. These controls are not sufficient as production abuse prevention.

**Required fix:** use a shared limiter (e.g. Redis), configure trusted proxy behavior explicitly, bound/expire keys, and add endpoint-specific quotas.

### M-02 — AI request parsing and image payload limits need hardening
**File:** `src/server/ai/http-handler.ts`

The handler relies on Content-Length for a 5 MB check; absent or misleading length can bypass this check before the body is parsed. Its parser can return an empty object after parse failures. Base64 image input is not comprehensively validated for decoded size or allowed MIME type.

**Required fix:** enforce streaming byte limits independent of Content-Length; reject malformed JSON with 400; validate schema, MIME allowlist, base64 and decoded byte size before model calls.

### M-03 — Signup username availability is only a timer-based demo check
**File:** `src/routes/auth.signup.tsx`

The UI marks most usernames available after a timeout without checking the canonical database. It can report availability incorrectly; the signup flow then uses the mock auth client.

**Required fix:** server-side uniqueness constraints and a real availability endpoint; handle uniqueness races at signup.

### M-04 — Age check uses a fragile year-difference calculation
**File:** `src/routes/auth.signup.tsx`

The age check derives age from elapsed milliseconds and year subtraction rather than calendar-date comparison. Boundary cases around birthdays/time zones may be misclassified. A client-only age check is not an enforceable policy.

**Required fix:** use a tested calendar-date calculation and enforce eligibility on the server, with appropriate privacy/minor-safety policies.

### M-05 — Social feature tests primarily validate in-memory/seed data behavior
**Files:** `tests/social-features-and-security.test.ts`; `tests/settings-and-security.test.ts`

Tests explicitly expect seed/local data and validate helper behavior. They do not establish that real cross-user authorization, database transactions, media access, API routes, or deployed auth work. OTP tests access the generated code, which is appropriate only in unit tests and must not be reflected by a production endpoint.

**Required fix:** add integration tests against a disposable PostgreSQL database and real HTTP handlers; test unauthenticated requests, cross-user IDOR, admin escalation, reset-token validation, MFA, rate limits, media permissions, and WebSocket ticket reuse.

### M-06 — External AI provider remains default
**Files:** `src/server/ai/router.ts`; `src/server/ai/adapters/gemini-adapter.ts`; `package.json`

The router defaults `OPEX_AI_PROVIDER` to `gemini`; the repository includes the Google GenAI SDK. The self-hosted adapter is available only when configured, and the autonomous fallback is a local rule-based adapter, not proof of a capable self-hosted LLM. This conflicts with the stated goal of an independent/self-hosted AI service.

**Required fix:** decide the production provider policy explicitly, default to a private self-hosted gateway only after it is provisioned and load-tested, and disclose fallback limitations.

### M-07 — Production supply-chain/reproducibility checks are incomplete
**Files:** repository root

The reviewed tree did not show a committed npm lockfile. CI workflows use `npm install`, which can resolve different dependency versions over time. The available workflow runs for the reviewed PR commits were not present at audit time, and the current production build/test results could not be verified from this review.

**Required fix:** commit the package-manager lockfile, use reproducible installs (`npm ci` for npm), add dependency/security scanning and secret scanning, and require passing checks before merge.

## Feature completeness / correctness gaps

- Many visible settings, subscriptions, payouts, cross-posting, parental controls, moderation, analytics, and admin capabilities are represented by client-side state, seeded data, or settings types; code inspection alone does not show these as backed by durable production services.
- Media storage and upload handling are not established as a complete secure production pipeline in the reviewed main-branch paths.
- Email/SMS delivery, account verification, recovery, durable sessions, and refresh-token rotation are not end-to-end in the reviewed main branch.
- Live streaming, music licensing, push notifications, payment/payout processing, and a running GPU model service require external infrastructure/configuration and were not verified as operational.
- Privacy settings must be enforced in backend queries/policies, not only saved in the UI.

## Priority remediation order

1. Disable/rewrite unsafe auth endpoints: OTP response disclosure, password reset, 2FA verification, sessions/revoke, security logs, recovery status.
2. Replace fabricated login/session tokens and demo identities with one canonical server-backed auth/session system.
3. Remove the Supabase service-role fallback and verify secret handling; review all migrations/RLS and any real database configuration.
4. Add server-side authorization to admin, profile, feed, stories, messages, media and AI routes.
5. Integrate the independent API with the frontend or explicitly select another canonical backend; remove the local-success adapter for production features.
6. Complete WebSocket ticket integration and authorization tests.
7. Add integration/security tests, lockfile, CI, dependency/secret scanning, observability, backup/restore and deployment smoke tests.
8. Re-audit the resulting diff and only then stage a production deployment.

## Not verified in this audit

- No live login/signup/reset/2FA tests were run against the deployed site.
- No production environment variables, Supabase project settings, Vercel deployment logs, database contents, or storage buckets were inspected.
- No automated dependency scanner, secret scanner, dynamic scanner, or external penetration test was run.
- No claim is made that every route and every line of the repository has been exhaustively reviewed.
