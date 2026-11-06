# Opexnal Current-State Scalability Gap Register

**Reviewed against:** source files on the current hyperscale blueprint branch. This is a source inspection, not a production deployment audit or load test.
**Purpose:** distinguish existing implementation from future architecture. This is a source inspection, not a production deployment audit or load test.

## 1. Observed current implementation

| Area | Evidence in repository | Current limitation |
|---|---|---|
| Web application | React + TypeScript + TanStack Start/Router in `package.json` | Web app is not itself proof of global scale. |
| API process | `backend/server.js` creates one Express app and one HTTP server | Domain logic currently shares one process and release lifecycle. |
| PostgreSQL | `pg.Pool` in `backend/server.js`; pool max defaults to 10 | One configured database endpoint/pool; no sharding or multi-region write topology is established by this code. |
| Authentication | JWT HS256 plus a database-backed `auth_sessions` lookup | Session revocation is checked, but README says refresh-token rotation is not implemented. |
| Rate limiting | Optional PostgreSQL atomic fixed-window limiter in API handlers when `RATE_LIMIT_HMAC_SECRET` is configured; bounded in-memory fallback otherwise | Shared limiter is wired into all identified rate-limited API handlers when the dedicated secret is configured; additive migration and bounded one-shot expiry cleanup worker exist. Migration/secret setup, external cleanup scheduling, PostgreSQL integration tests, and multi-instance load validation remain outstanding. |
| Cache adapter | Optional Memcached ASCII-protocol JSON adapter with bounded payloads, TTLs, timeouts, and stable key-to-server selection | Adapter is not yet wired to application endpoints; no cache hit-rate or invalidation behavior has been measured. Sensitive/authz-dependent responses are intentionally not cached. |\n| Social graph reads | Additive indexes cover reverse block/restriction lookup, pending follow-request ordering, and stable incoming/outgoing follow cursors; follow-request and follower-list APIs support bounded keyset pagination using stable timestamp/ID cursors | Cursor-index migrations must be applied; a read-only EXPLAIN ANALYZE diagnostic script is authored, but no query-plan results, large-cardinality benchmarks, or dedicated graph service are established. |\n| WebSocket presence | In-memory `Map` named `socketsByUser` in `backend/server.js` | Connections and fan-out state are local to one process; multi-instance delivery needs a shared pub/sub or broker design. |
| Feed reads | Home feed supports bounded keyset pagination using `(created_at,id)` while retaining the legacy timestamp cursor; active-feed and per-user active-post indexes and a read-only EXPLAIN diagnostic are authored | Migrations not applied; no authorization-filtered query-plan results or benchmark yet. |
| Notifications | Identified notification-producing routes write versioned outbox events transactionally; notifications API supports bounded keyset pagination | Notification cursor index migration must be applied; unread count is still an exact COUNT query; worker supervision, scheduled alerting, and PostgreSQL integration tests remain. |
| Media storage | Multer writes files under `MEDIA_STORAGE_DIR`; README documents local volume storage and signed private URLs | Local disk is not a globally durable object store or CDN. Backups and multi-host access need a deliberate storage adapter. |
| Email | Nodemailer SMTP transport configured from environment variables | Email requires production SMTP configuration. |
| Phone / WhatsApp OTP | Draft PR #47 describes server-side OTP foundation, but explicitly says frontend wiring, destination-to-account binding, session issuance, shared throttling, and delivery/runtime tests remain outstanding | Do not claim phone OTP login is end-to-end working based on the draft API foundation alone. Preserve current OTP work and finish the complete verified flow. |
| Search / recommendations | No independently deployed search or recommendation service is established by the inspected backend README/server entry point | Treat as future domain modules until concrete services and tests exist. |
| Video processing | Upload accepts video file types, but README does not establish transcoding workers or adaptive HLS/DASH output | Upload support is not equivalent to a production video pipeline. |

## 2. Highest-priority scale blockers

### P0 — Correctness and security before horizontal scaling

1. Apply the rate-limit migration, configure the same dedicated HMAC secret on every API replica, schedule the bounded cleanup worker, and complete PostgreSQL integration/load tests before public scaling.
2. Add distributed WebSocket coordination or a broker-backed event channel; do not rely on process-local socket maps for cross-replica delivery.
3. Complete OTP end-to-end: challenge issue, provider delivery, verification, verified destination binding to the intended account, session issuance/revocation, replay protection, shared rate limits, and provider failure handling.
4. Keep all provider secrets in the deployment secret manager; no credentials in source, client bundles, logs, or test fixtures.
5. Add integration tests against a disposable PostgreSQL instance and mocked/provider-sandbox delivery. Unit tests alone do not prove delivery or multi-instance behavior.

### P1 — Durable asynchronous processing

1. Introduce a transactional outbox table and publisher worker.
2. Publish versioned events for post creation, media readiness, likes/comments, follows, messages, and notification requests.
3. Make consumers idempotent using event IDs and unique constraints.
4. Add retries, dead-letter handling, queue-age monitoring, and replay tooling.
5. Move media transformations and notification provider calls off latency-sensitive request paths.

### P2 — Storage and delivery

1. Define an object-storage interface and S3-compatible implementation.
2. Use short-lived signed upload/download URLs with ownership and visibility checks.
3. Store media metadata and object keys in PostgreSQL; store media bytes in object storage.
4. Add image derivatives, thumbnails, video transcode jobs, and CDN cache invalidation/deletion workflows.
5. Preserve local storage only as a development adapter, not a multi-region production assumption.

### P3 — Data and traffic scale

1. Add query-plan review and indexes based on measured slow-query data.
2. Introduce connection pooling/proxying and explicit per-service connection budgets.
3. Extend keyset pagination to search, following lists, and remaining large lists; follow-request, notification, conversation-inbox, message-history, and home-feed pagination are now implemented in the API. Apply the corresponding index migrations and benchmark.
4. Add read replicas only for queries with understood consistency requirements.
5. Introduce partitioning/sharding only after measured bottlenecks and a migration/restore plan exist.
6. Add region-aware routing and failover only after replication lag and recovery objectives are tested.

## 3. Proposed domain ownership

| Domain | Authoritative data | Async events / derived data |
|---|---|---|
| Identity | users, auth_sessions, verification challenges | security alerts, login activity |
| Social graph | follows, follow_requests, blocks, restrictions | follower counts, suggestions |
| Publishing | posts, post_media metadata | feed candidates, moderation jobs |
| Media | upload records and object ownership | thumbnails, renditions, CDN state |
| Engagement | likes, comments, saves, shares | counters, notification requests |
| Messaging | conversations, members, durable messages; inbox keyset pagination by activity timestamp and conversation ID; message history keyset pagination in chronological response order | push notifications, unread summaries; inbox/message cursor migrations and large-inbox/history benchmarks remain |
| Feed | no duplicate ownership of source posts | ranked/cached candidate lists |
| Discovery | search index and ranking features are derived | trending topics, recommendations |
| Trust & safety | reports, moderation decisions, enforcement records | review queues and audit events |

A domain must not independently mutate another domain's authoritative tables. Start with module boundaries and enforce them in code before extracting deployable services.

## 4. Required performance evidence

Every capacity claim must include:

- Exact commit SHA and test environment
- Dataset size and workload mix
- Concurrent users/connections and request rate
- p50, p95, and p99 latency
- Error and timeout rates
- CPU, memory, database connection, I/O, and queue saturation
- Cache hit ratio and replication lag where applicable
- Test duration (including soak test)
- Cost estimate and observed bottleneck

Run separate tests for login, feed reads, post creation, media upload, video playback, messaging, and notification fan-out. A single synthetic request benchmark is not representative of a social network.

## 5. Guardrails

- The 10-billion registered-account objective is a long-term design target, not current demonstrated capacity.
- Do not translate registered accounts into concurrent-user claims.
- Do not deploy a new broker, Redis cluster, database topology, or cloud region without cost, operational ownership, secret management, backup, and rollback plans.
- Do not disable OTP or remove existing features to simplify scaling work.
- Do not merge to `main`, run production migrations, alter production secrets, or deploy without explicit owner authorization.

## 6. Next implementation sequence

1. Map each existing endpoint and SQL table to a domain owner.
2. Complete PostgreSQL-backed shared rate-limit integration tests, cleanup supervision, and multi-instance load validation.
3. Add an outbox schema plus idempotent worker.
4. Add object-storage adapter and migration path from local media volume.
5. Complete OTP provider-to-session integration and end-to-end tests.
6. Add reproducible performance test profiles and publish measured results.
