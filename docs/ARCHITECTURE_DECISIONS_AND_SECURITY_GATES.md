# Opexnal architecture decision and integration plan

Status: proposed baseline for the independent-backend branch. This document is not a claim that the platform is production-ready.

## Decision

For the owner-controlled deployment target, use the first-party Node.js API and PostgreSQL as the canonical identity and application-data system. The React/TanStack web client and future Expo client must call the API over HTTPS. Do not combine Supabase Auth sessions with the independent API's JWT identity in the same production login flow.

The existing Supabase-auth hardening branch is a separate migration path and must not be merged into this architecture without an explicit compatibility plan. Keep `main` unchanged until the independent API migration is reviewed and tested.

## Initial deployment shape

- Web/mobile clients: existing web UI first; mobile client later.
- API: one modular Node.js/Express service, versioned under `/api/v1`.
- Identity and relational data: PostgreSQL.
- Media: S3-compatible object storage (self-hosted MinIO is an option); never store large media blobs in PostgreSQL.
- Realtime: authenticated WebSocket endpoint; authorization must be checked per conversation/resource.
- Opex AI: separate internal model gateway, initially one service. GPU inference can use a self-hosted runtime such as vLLM or Ollama when suitable hardware is available.
- Operations: reverse proxy with TLS, private database network, backups, monitoring, and separate development/production configuration.

Start as a modular monolith. Add Redis, search, vector databases, worker queues, or separate microservices only when an implemented feature and measured load justify them.

## Mandatory security gates before public launch

1. **Authentication lifecycle:** implement email verification and password recovery using cryptographically random, hashed, expiring, single-use tokens; never claim these flows work until delivery and callback verification are implemented.
2. **Session lifecycle:** replace stateless-only access-token login/logout with durable sessions, short-lived access tokens, refresh-token rotation, reuse detection, and server-side revocation. Store only hashes of refresh tokens.
3. **Authorization:** check membership and resource ownership on every post, conversation, message, media, moderation, and admin operation. Do not trust user-supplied role values.
4. **Rate limiting:** current in-process maps are not shared across replicas. Use a shared limiter (for example Redis) for production, plus proxy-level limits and bounded request bodies.
5. **WebSocket safety:** avoid putting bearer tokens in query strings because URLs can enter logs. Prefer an authenticated handshake/header or a short-lived, single-use WebSocket ticket; authorize every event and conversation.
6. **Media:** use generated object keys, content-type/size validation, upload limits, malware scanning where appropriate, private-by-default storage, and short-lived signed access URLs.
7. **Secrets and transport:** fail closed in production when required secrets/configuration are missing; keep PostgreSQL and inference services on private networks; terminate TLS at a trusted reverse proxy.
8. **Operational safety:** automated encrypted backups, documented restore drills, structured redacted logs, dependency/secret scanning, health checks, alerting, and incident-response steps.
9. **Tests:** automated signup/login/verification/recovery/session-revocation tests, cross-user authorization tests, rate-limit tests, upload tests, and WebSocket authorization tests.
10. **Client migration:** remove the localStorage/in-memory adapter only after each UI feature has a working API implementation and regression tests. Do not silently show seeded/demo data as live user data.

## AI service boundary

The web/mobile client must never receive model-server credentials. The API authenticates the user, enforces per-user limits and safety policy, then calls the private Opex AI gateway. The gateway should expose a narrow internal interface (for example, chat completion and caption generation), validate input/output, apply timeouts, and record redacted usage metrics. Do not expose GPU inference ports directly to the public internet.

## Scope and dependencies

“Self-hosted” means Opexnal controls the deployed services, data, and credentials. It does not mean literally zero software dependencies: Node.js, PostgreSQL, model runtimes, operating systems, and libraries still require updates and vulnerability management. External hosted platforms and paid APIs should remain optional, documented integrations—not hidden requirements.

## Current known gaps

The independent API branch documentation says email verification/recovery delivery, phone OTP, durable sessions and refresh-token rotation are incomplete, and the web app has not been fully migrated from its local adapter. The GPU deployment files are configuration only; they do not prove a GPU server is provisioned or running. Treat all of these as blockers until implemented and verified.

## Recommended order

1. Add automated tests and fix current API security/authorization gaps.
2. Implement durable sessions and token rotation/revocation.
3. Implement email verification and recovery end-to-end.
4. Add API client and migrate one vertical slice at a time (profile, then posts/feed, then messaging).
5. Add media storage and background processing.
6. Connect the private Opex AI gateway.
7. Deploy to owner-controlled infrastructure; verify backups, TLS, monitoring, and restore before public launch.
