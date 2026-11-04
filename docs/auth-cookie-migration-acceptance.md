# HttpOnly Cookie Authentication Migration: Acceptance Checklist

Status: planning/verification checklist for PR #41. This document does not claim that cookie-only authentication is implemented or production-ready.

## Current compatibility contract

- Keep the legacy Bearer-token path until every browser, server-function, API, and Android consumer has been migrated and tested.
- The backend currently accepts a session cookie as well as a Bearer token on protected API routes.
- The browser client still requires an `accessToken`, stores it in `sessionStorage`, and does not restore a session from the HttpOnly cookie after a fresh page load.
- The same-origin `/api` proxy is the compatible default for browser cookie requests. A direct API origin requires a separately designed and tested cross-origin cookie/CORS/CSRF configuration.

## Required backend integration tests

- [ ] Successful password login creates a persistent server-side session and sends an HttpOnly session cookie.
- [ ] Cookie-authenticated `GET /api/v1/auth/me` returns the authenticated user.
- [ ] Missing, malformed, expired, and revoked session cookies are rejected.
- [ ] Logout revokes the server-side session and sends a clearing `Set-Cookie` header.
- [ ] Cookie-authenticated state-changing requests reject untrusted Origin and cross-site Fetch Metadata.
- [ ] Requests without a configured database or secure JWT secret fail closed.

## Required browser/client tests

- [ ] A successful login can establish client auth state from a cookie-backed flow without requiring an access token in the response.
- [ ] A full page reload with empty `sessionStorage` restores the user through same-origin `/api/v1/auth/me`.
- [ ] A transient API/network error is distinguishable from a confirmed unauthenticated response; do not silently redirect on transient failures.
- [ ] Logout clears client state and invalidates the server-side session.
- [ ] Auth state listeners receive consistent signed-in/signed-out events during bootstrap and logout.

## Supabase compatibility adapter: required coverage

The adapter in `src/integrations/supabase/client.ts` has additional authenticated operations that must be covered independently:

- [ ] Feed reads send same-origin cookies and are tested with a cookie-only browser session.
- [ ] Story list reads send same-origin cookies and are tested with a cookie-only browser session.
- [ ] Post and story creation send same-origin cookies and preserve existing request bodies and error handling.
- [ ] Storage upload sends same-origin cookies; test successful upload and unauthenticated rejection.
- [ ] Signed-URL creation sends same-origin cookies; test ownership/authorization rejection for another user's object.
- [ ] Storage deletion sends same-origin cookies; test ownership/authorization rejection for another user's object.
- [ ] Confirm whether each adapter operation still needs legacy Bearer compatibility; do not remove it until all native/server consumers are migrated.
- [ ] Do not synthesize an `access_token` or fake Bearer header to represent an HttpOnly cookie session.

## Consumer and deployment checks

- [ ] Audit all `getAuthHeader()`, direct `Authorization: Bearer`, Supabase auth-attacher, and server-function middleware consumers.
- [ ] Verify Posts, Stories, Messages, Profile, Notifications, AI, Settings, and admin routes with cookie auth.
- [ ] Verify Android/native clients separately; do not assume browser cookie behavior applies to native networking.
- [ ] If cookie mode is enabled, enforce same-origin proxy mode unless cross-origin cookies have been explicitly implemented and tested.
- [ ] Verify production API URL, persistent PostgreSQL, exact trusted `CORS_ORIGINS`, HTTPS/TLS, Secure/HttpOnly/SameSite cookie attributes, and CSRF protections.
- [ ] Run browser end-to-end tests against a deployed staging API before production rollout.

## Merge/rollout rule

A passing lint/build/unit workflow is necessary but not sufficient. Do not remove the legacy Bearer path or call this migration production-ready until the backend integration tests, browser reload tests, consumer audit, Android checks, and staging login/logout verification above pass.
