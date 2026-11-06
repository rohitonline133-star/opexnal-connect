# Opexnal Hyperscale Scalability Blueprint

**Status:** Architecture blueprint / implementation plan. This document does not claim that the current deployment can serve billions of users. Capacity must be demonstrated through measured load, resilience, security, and cost tests.

## 1. Product and scale objectives

Design Opexnal so the platform can evolve from an initial production footprint to a globally distributed social platform without a disruptive rewrite.

Keep these measures separate:

- Registered accounts
- Monthly active users (MAU)
- Daily active users (DAU)
- Peak concurrent connections
- Requests per second (RPS)
- Media ingress and egress (GB/TB per day)
- Feed generation and delivery latency
- Message delivery latency

A target of 10 billion registered accounts is not equivalent to 10 billion concurrent users. No capacity claim is valid without a workload model and repeatable test evidence.

## 2. Architecture evolution

### Phase A — Reliable modular foundation

Retain the current application stack where it is already working:

- Web application: React, TypeScript, TanStack Router/Start.
- API/backend: Node.js and Express, with typed contracts and validation.
- Primary relational store: PostgreSQL/Supabase, with migrations, constraints, indexes, and row-level authorization where applicable.
- Media: S3-compatible object storage; media bytes must not be stored in relational rows.
- Delivery: CDN for public or explicitly authorized media.
- Cache and shared coordination: Redis-compatible service when configured.
- Background work: durable queue and worker processes; use an outbox pattern so committed database changes are not lost between the database and broker.

Keep service boundaries as modules first. Do not split every domain into a separately deployed microservice before traffic, team ownership, and operational maturity justify it.

### Phase B — Independently scalable domains

Extract a domain only when its load or release lifecycle justifies independent scaling:

1. Identity and account service
2. Profile and privacy service
3. Social graph / follow service
4. Post and metadata service
5. Media upload and processing service
6. Feed ranking and delivery service
7. Engagement service (likes, comments, saves, shares)
8. Messaging and presence service
9. Notification delivery service
10. Search and discovery service
11. Moderation and safety service
12. Creator analytics service

Each service needs an explicit owner, API/event contract, data ownership, SLO, runbook, and failure behavior. Avoid shared-table writes across services.

### Phase C — Multi-region and edge delivery

- Use multiple availability zones before adding multiple write regions.
- Place CDN caches and media processing near users; keep origin storage durable and access-controlled.
- Use regional API entry points and health-based traffic routing.
- Assign each account or conversation a home region for authoritative writes initially.
- Replicate read models and public content across regions with documented consistency expectations.
- Add regional failover only after replication lag, split-brain prevention, recovery objectives, and data-residency requirements are tested.
- Keep control-plane operations separate from latency-sensitive user traffic.

Edge nodes should handle cacheable delivery and bounded computation. They should not independently mutate authoritative account, payment, or privacy state without a carefully designed consistency protocol.

## 3. Data architecture

### PostgreSQL as the source of truth

Use PostgreSQL for transactional entities such as accounts, privacy settings, follows, post metadata, moderation decisions, and authorization records while the workload fits.

- Add indexes based on measured query plans.
- Use cursor pagination, not unbounded offset scans for high-volume timelines.
- Partition large append-heavy tables by a justified key and retention policy.
- Use read replicas for eligible read traffic.
- Define backup, point-in-time recovery, restore drills, and retention policies.

### Sharding and geo-partitioning

Introduce sharding only when a measured bottleneck requires it. Choose stable partition keys and document cross-shard query behavior. Candidate keys differ by domain:

- Account data: account ID / home region
- Conversations: conversation ID
- Messages: conversation ID plus time bucket
- Posts: creator/account ID or post ID, depending on access patterns
- Events: time and tenant/region partitions

Do not create a database cluster for every city by default. That multiplies operational overhead and complicates consistency, migrations, backups, and data residency. Start with a small number of well-operated regions and expand from evidence.

### Specialized stores

- Redis: ephemeral cache, shared rate-limit counters, presence, and short-lived coordination; never the only copy of durable business data.
- Search engine: derived index for full-text and discovery queries.
- Wide-column / distributed store: consider for very high-volume feed or message workloads only after workload benchmarks establish the need.
- Object storage: originals, variants, thumbnails, and processed media with lifecycle policies.

## 4. Events, queues, and consistency

Use versioned events with unique IDs, timestamps, actor/subject IDs, schema versions, and idempotency keys.

- Write business state and an outbox record in one database transaction.
- Publish outbox events asynchronously.
- Consumers must be idempotent and tolerate retries and duplicate delivery.
- Use dead-letter queues, bounded retries, replay tooling, and poison-message alerts.
- Define which actions require strong consistency (e.g. account ownership, privacy changes) and which can be eventually consistent (e.g. feed counters, recommendation features).
- Do not promise exactly-once delivery; design for at-least-once delivery with idempotent processing.

## 5. Domain-specific scaling patterns

### Feed

Use a hybrid fan-out model:

- Fan-out-on-write for ordinary accounts where it is cost-effective.
- Fan-out-on-read for very high-follower accounts and expensive personalized cases.
- Cache candidate sets, then apply privacy, block, mute, ranking, and freshness rules at delivery.
- Support cursor pagination and deduplication.
- Treat ranking as a versioned service so the system can fall back to chronological or following-only feeds.

### Media and video

- Upload directly to object storage using short-lived signed upload permissions.
- Validate size, file signature, MIME type, and ownership.
- Process asynchronously into thumbnails and adaptive bitrate renditions.
- Use HLS/DASH where appropriate and CDN delivery for playback.
- Keep processing workers isolated with resource quotas and safe parsers.
- Apply retention, deletion, and copyright/moderation workflows to originals and derived assets.

### Messaging

- Use WebSockets for interactive sessions where appropriate; horizontally scale connection gateways.
- Store durable messages before acknowledging successful send.
- Partition by conversation and use sequence numbers for ordering within a conversation.
- Treat online presence and typing indicators as ephemeral.
- E2E encryption requires a reviewed key-management and multi-device protocol; TLS alone is not end-to-end encryption.

### Notifications

- Separate event creation from channel delivery.
- Use per-channel workers for push, email, and in-app notifications.
- Respect user preferences, quiet hours, retry limits, provider feedback, and deduplication.

### Search and recommendations

- Build search indexes asynchronously from authoritative records.
- Keep recommendation features and models versioned and observable.
- Start with measurable ranking baselines before introducing GPU-heavy models.
- Provide safe fallbacks when ranking or model infrastructure is unavailable.

## 5A. Large-scale industry reference patterns (Meta / OCP)

Use large social-platform engineering as a source of design patterns, not as a requirement to reproduce proprietary systems. The names below describe reference approaches; they are not evidence that Opexnal has deployed equivalent infrastructure.

| Reference | Transferable engineering idea | Opexnal adoption path |
|---|---|---|
| Open Compute Project (OCP) | Open hardware specifications and efficient rack/data-center designs | Prefer standard cloud or colocation infrastructure first; evaluate OCP-compatible hardware only when Opexnal operates its own fleet and has measured power, cooling, and total-cost requirements. OCP itself is an open industry project, not a single proprietary Meta server product. |
| Tupperware / Twine | Container scheduling, deployment orchestration, placement, and fleet management | Use a maintained orchestrator such as Kubernetes or a managed container platform. Add autoscaling, health checks, rollout/rollback, resource quotas, and regional placement; do not attempt a bespoke scheduler at the current stage. |
| TAO-style social graph | Low-latency graph-edge access for relationships and social actions | Keep PostgreSQL authoritative initially; model follows/blocks/mutes with indexed, well-defined edges and build read-optimized projections/caches. Consider a graph-specific store only after real traversal/query benchmarks justify it. |
| MyRocks | LSM-tree storage-engine trade-offs for write-heavy workloads | Benchmark PostgreSQL and suitable managed/distributed alternatives using Opexnal's actual read/write mix before considering a storage-engine or database migration. |
| Memcached clusters | Distributed in-memory caching to reduce repeated database reads | Introduce a shared cache for disposable, reconstructible data with TTLs, bounded memory, invalidation rules, and stampede protection. Redis may also serve coordination/rate-limit needs; neither cache is the durable source of truth. |
| PyTorch | Train and serve ranking, recommendation, and moderation models | Start with offline evaluation and a small inference service; version datasets/models, monitor quality and drift, protect user data, and retain deterministic non-AI fallbacks. |
| Meta Scalable Video Processor (MSVP) / custom video ASICs | Hardware acceleration for high-volume video processing | Use cloud or open-source transcoding workers (for example FFmpeg-based pipelines) and adaptive-bitrate HLS/DASH first. Consider specialized accelerators only after codec, throughput, energy, and unit-cost benchmarks show a clear advantage. |

### Adoption gates

1. Do not select infrastructure from brand prestige alone; compare operational burden, portability, security, and total cost.
2. Keep PostgreSQL and object storage authoritative until measured bottlenecks justify specialized stores.
3. Treat caches, search indexes, feed projections, and graph read models as rebuildable derived data.
4. Introduce orchestration and model-serving complexity only with monitoring, rollback, capacity tests, and an accountable operator.
5. Custom silicon, private global networks, and petabyte-scale RAM fleets are long-term possibilities, not near-term prerequisites or current Opexnal capabilities.

## 6. Network and service protocols

- Keep HTTPS/HTTP APIs as the default public interface.
- Use HTTP/2 or HTTP/3 and QUIC where supported and justified by measurements.
- Use gRPC or another typed internal protocol selectively for service-to-service calls.
- UDP is not a drop-in replacement for TCP; QUIC runs over UDP and supplies reliability, congestion control, and stream multiplexing.
- Rust or Go may be appropriate for CPU- or memory-sensitive services, but language choice must follow profiling and team maintainability, not assumptions.

## 7. Security, privacy, and resilience

- Use TLS in transit and managed encryption at rest.
- Keep secrets in a secrets manager; rotate credentials and scope permissions.
- Apply authentication, authorization, resource ownership checks, and rate limits at every relevant boundary.
- Use shared Redis-backed rate limits for multi-instance deployments; process-local counters are not a global abuse-control mechanism.
- Enforce private network access for databases and internal services.
- Use least-privilege service identities and short-lived credentials.
- Record auditable administrative and security events without logging passwords, OTPs, tokens, or sensitive message contents.
- Define data residency, deletion propagation, export, retention, and legal hold behavior.
- Use circuit breakers, timeouts, bulkheads, graceful degradation, and tested restore/failover procedures.
- AI operations may recommend or execute bounded remediation, but high-impact actions require policy controls, audit trails, rollback, and human approval where appropriate.

## 8. Observability and service objectives

Every service should expose:

- Request rate, latency percentiles, and error rate
- Saturation: CPU, memory, connections, queue depth, and storage
- Dependency health and timeout rates
- Queue age, retry count, and dead-letter count
- Replication lag and backup/restore health
- Cost per active user and per media GB delivered

Define service-level objectives before scaling, for example availability and p95/p99 latency targets for login, feed, upload initiation, and message send. Targets must be selected from product requirements and measured baselines, not invented as current performance.

## 9. Capacity and cost gates

Before each scale phase:

1. Define realistic traffic mixes and peak-to-average ratios.
2. Run load, soak, spike, and regional-failure tests.
3. Verify database query plans, connection pooling, queue throughput, and CDN hit ratios.
4. Measure cost per 1,000 requests, per active user, and per GB of media delivery.
5. Verify autoscaling limits, quotas, provider limits, and operational on-call coverage.
6. Run backup restoration and disaster-recovery exercises.
7. Publish test date, commit, environment, workload, achieved throughput, latency, error rate, and bottlenecks.

A system must not be described as supporting a user count merely because its architecture diagram contains sharding or microservices.

## 10. Current repository alignment and immediate work

The current repository uses a React/TypeScript application, Node.js/Express backend, PostgreSQL/Supabase dependencies, and a Docker-based Node runtime. Keep the current working application intact while the architecture evolves.

Immediate engineering priorities:

1. Map existing routes, backend endpoints, database tables, and external integrations to the domain boundaries above.
2. Identify direct cross-domain database access and define ownership before extracting services.
3. Replace process-local security throttles with shared, atomic rate limiting before multi-instance deployment.
4. Complete OTP delivery, verification, account binding, and session issuance end-to-end; keep OTP available and do not represent an unconfigured channel as working.
5. Introduce durable background jobs and an outbox for media, feed, moderation, and notification events.
6. Add object storage/CDN integration and asynchronous media processing with deletion propagation.
7. Add load-test scenarios and measurable capacity reports to CI or a controlled performance environment.
8. Keep infrastructure provider choices portable through documented interfaces and deployment configuration.

## 11. Explicit non-goals

- No claim of 10-billion-user capacity today.
- No premature city-level database clusters or planet-scale private fiber/satellite buildout.
- No custom transport protocol without benchmark evidence.
- No automatic production changes by AI agents without permissions, safeguards, and auditability.
- No destructive database migration, production secret change, main-branch merge, or deployment as part of this blueprint alone.
