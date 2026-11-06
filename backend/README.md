# Opexnal Connect — independent API

First-party Node.js/Express API with PostgreSQL persistence, JWT access tokens, and WebSocket notifications. No Supabase Auth or database SDK is used by this backend.

## Local setup

Requirements: Node.js 22+, PostgreSQL 15+.

1. Copy .env.example to .env and set DATABASE_URL and a unique JWT_SECRET of at least 32 characters.
2. Configure a self-hosted SMTP server using SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, and PUBLIC_WEB_URL. Signup deliberately returns 503 and creates no account when email verification delivery is not configured.
3. Install dependencies at repository root with npm install.
4. Create a PostgreSQL database and run: psql "$DATABASE_URL" -f backend/schema.sql
   psql "$DATABASE_URL" -f backend/migrations/20261022_first_party_security_social.sql
   psql "$DATABASE_URL" -f backend/migrations/20261104_account_recovery.sql
   psql "$DATABASE_URL" -f backend/migrations/20261106_post_archive.sql
   psql "$DATABASE_URL" -f backend/migrations/20261106_post_like_visibility.sql
   psql "$DATABASE_URL" -f backend/migrations/20261107_transactional_outbox.sql
5. Start the API with npm run backend:start; health check: GET http://localhost:4000/health.

## Endpoints

- POST /api/v1/auth/signup — username/email/password registration (password hashed using Node scrypt); requires SMTP delivery and a 13+ date of birth.
- GET /api/v1/auth/verify-email?token=… — consumes a 30-minute single-use email verification token.
- POST /api/v1/auth/login — returns a short-lived HS256 JWT only after email verification.
- GET /api/v1/auth/me, POST /api/v1/auth/logout.
- POST /api/auth/recovery/request and POST /api/auth/recovery/status — persist a recovery intake and track it with a private bearer ticket ID. Account identifiers are stored as keyed HMAC hashes and ticket IDs as SHA-256 hashes; tracking tickets expire after 90 days. Requests are not automatic account restoration.
- GET /api/v1/posts/feed, POST /api/v1/posts.
- GET/POST /api/v1/stories — stories expire after 24 hours.
- GET /api/v1/reels — video posts.
- GET/POST /api/v1/messages/conversations; GET/POST/DELETE /api/v1/messages/:conversationId; member/read/reaction endpoints.
- GET /health. For WebSocket access, POST /api/v1/auth/websocket-ticket and connect to /ws?ticket=<single-use-ticket>; tickets expire in 30 seconds and can be consumed once.

## Deployment boundary

The frontend and API are separate processes. Deploy the API on a Node.js host that supports WebSocket connections and configure OPEXNAL_API_URL on the web server to the API's fixed origin. The TanStack server proxies /api/v1/* requests to that configured origin. The current Vercel environment has not been configured with this API URL, and several legacy data modules still need migration to first-party endpoints; this is not a completed production migration.

### Producer transaction contract

Application code can use `backend/lib/outbox.js` and call `enqueueOutboxEvent(client, event)` with a PostgreSQL transaction client. The helper validates the envelope and uses the unique idempotency key to avoid duplicate event rows. The notification routes call the transaction-aware helper with the same PostgreSQL client used for their authoritative write. Post comments, follow-request acceptance, public/private follow, post likes, and messages now commit their data changes and notification events atomically.

## Transactional outbox worker

The worker supports version 1 `notification.requested` events. After applying the migration, configure `DATABASE_URL` and run `npm run backend:outbox` as a separately supervised process. It claims rows with PostgreSQL `FOR UPDATE SKIP LOCKED`, processes each claimed event concurrently within the configured pool capacity, writes the notification and marks the event published in one transaction, and uses the event UUID as the notification ID for idempotent retries. Failed events use bounded exponential retry and move to `dead` after the configured attempt limit. Structured logs report published, retry-scheduled, and dead-lettered outcomes without logging event payloads. Run `npm run backend:outbox:health` as a read-only check to report pending, processing, dead, stale-processing, and oldest-pending-age metrics; it exits non-zero when configured thresholds are exceeded.

Optional environment settings are validated at startup: `OUTBOX_DB_POOL_MAX` (default 3, range 1–20), `OUTBOX_BATCH_SIZE` (default 3, range 1–20 and never greater than the pool size), `OUTBOX_POLL_INTERVAL_MS` (default 1000, range 250–30000), `OUTBOX_MAX_ATTEMPTS` (default 8, range 1–20), `OUTBOX_LEASE_SECONDS` (default 300, range 30–3600), and `OUTBOX_WORKER_ID` (1–120 safe characters). The health check accepts `OUTBOX_HEALTH_MAX_PENDING_AGE_SECONDS` (default 300), `OUTBOX_HEALTH_MAX_STALE_PROCESSING` (default 0), and `OUTBOX_HEALTH_MAX_DEAD_EVENTS` (default 0). Invalid values stop startup with a configuration error.

**Operational boundary:** all currently identified notification-producing routes enqueue events in the same transaction as their authoritative database write. The outbox worker is a separate process and must be deployed and supervised independently; it does not start with the Express API. WebSocket message fan-out occurs after commit and is best-effort; the durable message and notification events remain in PostgreSQL. Do not run multiple independent delivery systems for the same notification. Schedule the health command in the deployment monitor and alert on its non-zero exit; configure process supervision and staging database integration tests before production use.

## Transactional outbox status

The migration `backend/migrations/20261107_transactional_outbox.sql` creates an additive outbox table and indexes only. All identified notification-producing routes enqueue events transactionally, and the worker must be operated separately. Notification persistence is idempotent per outbox event; semantic deduplication across separate user actions is not implemented. The read-only health command is available, but scheduling it in external monitoring, database integration tests, and production worker supervision remain outstanding. Keep sensitive values out of event payloads.

## Not yet production complete

- Email verification uses the configured SMTP server and expiring, single-use hashed tokens. Password reset is email-only; phone OTP/SMS delivery is not implemented. Recovery intake records a request but does not verify ownership, send a notification, or restore account access; a staffed review workflow and operator tooling are still required.
- Durable access sessions and revocation are implemented; refresh-token rotation is not implemented, and access tokens expire after one hour.
- WebSocket authorization uses one-time tickets bound to a currently active server-side session; it only broadcasts messages created through authenticated REST routes.
- Rate limiting is process-local, not distributed. Add Redis rate limiting, stricter request validation, media storage, integration tests, monitoring, backups, and load testing before public launch.
- Never commit .env or production credentials.

## Web deployment and API proxy

The TanStack web server proxies `/api/*` to the API using the server-only `OPEXNAL_API_URL` environment variable. For a Vercel web deployment, set `OPEXNAL_API_URL` to the public HTTPS origin of the separately deployed Node API, and set `PUBLIC_WEB_URL` to the exact HTTPS origin of the web app. Leave `VITE_OPEXNAL_API_URL` blank to use the same-origin proxy. Do not point a browser at a Docker-only hostname such as `api:4000`.

The self-hosted Compose setup uses `OPEXNAL_API_URL=http://api:4000` internally and a same-origin web proxy. The default `VITE_OPEXNAL_API_URL` is blank. For a public deployment, use HTTPS and configure trusted reverse-proxy/TLS settings before exposing the API. Vercel does not run the long-lived Express/WebSocket process or PostgreSQL; those need a separate host and managed/persistent database/media storage.

## First administrator

New accounts receive the `user` role. The app does not allow users to promote themselves. After verifying the intended owner account, an operator with database access must grant the first administrator role manually, for example:

```sql
UPDATE users SET role = 'admin' WHERE email = 'owner@example.com';
```

Replace the example email with the verified owner account. Do not expose database credentials in the web app or commit them to Git.

## First-party media

Media uploads use the API's local `MEDIA_STORAGE_DIR` volume, enforce file-size and MIME/signature checks, and store ownership metadata in PostgreSQL. Private media uses short-lived HMAC-signed URLs. The volume must be backed up and has not been load-tested; use durable object storage for a larger production deployment.
