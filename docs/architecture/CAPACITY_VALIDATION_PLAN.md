# Opexnal Capacity Validation Plan

## Purpose

This plan defines evidence required before increasing Opexnal traffic limits or claiming a capacity milestone. A target such as 10 billion registered accounts is a long-range product goal, not a demonstrated serving capacity. Registered accounts, monthly active users, daily active users, peak requests per second, concurrent WebSocket connections, and stored media bytes are separate capacity dimensions.

## Current baseline

The inspected backend is a single Express process backed by PostgreSQL. The pool defaults to 10 connections, rate-limit state and WebSocket user mappings are process-local, and uploaded media is stored on a local volume. These are valid early-stage choices but do not establish horizontal or multi-region capacity. See [CURRENT_STATE_AND_GAPS.md](./CURRENT_STATE_AND_GAPS.md).

## Required test environment

- Use an isolated staging environment with production-like API, database version, indexes, proxy/TLS path, and media storage.
- Use synthetic accounts and generated media only. Never load-test real users or send real OTP/email messages during a stress test.
- Record the exact commit, infrastructure sizes, database pool limits, test data volume, region, and test script version with every run.
- Set explicit spend ceilings, request ceilings, and an automatic stop condition before running a test.
- Keep secrets and real personal data out of test fixtures and reports.

## Workload profiles

| Profile | Traffic shape | What it validates |
| --- | --- | --- |
| Authentication | signup, login, session lookup, logout; invalid attempts | password hashing cost, session queries, abuse controls |
| Feed | mixed read-heavy feed pagination and post creation | query plans, indexes, cache hit rate, hot-user behavior |
| Social writes | likes, comments, follows, saves | write contention, uniqueness constraints, notification fan-out |
| Messaging | conversation reads/writes and WebSocket reconnects | connection lifecycle, ordering, backpressure, delivery behavior |
| Media | signed upload, metadata write, read/download | storage throughput, CDN behavior, upload limits |
| Recovery/OTP | provider sandbox only, throttled synthetic requests | provider latency, resend controls, spend and abuse limits |

Run each profile independently first, then as a weighted mixed workload based on measured product telemetry. Do not invent a traffic mix before telemetry exists.

## Measurements to capture

For every endpoint and workload, capture request rate, successful throughput, p50/p95/p99 latency, timeout rate, HTTP error rate, CPU, memory, event-loop delay, database active/idle/waiting connections, slow-query count, lock waits, cache hit/miss ratio, queue depth and oldest-message age (when a queue exists), WebSocket active connections/reconnects, storage throughput, and estimated cost per successful operation.

## Release gates

A capacity step is accepted only when all of the following are true for the agreed target workload:

1. No unexplained data loss, duplicate side effects, authorization bypass, or cross-account data exposure.
2. Error rate and p95/p99 latency stay within an SLO written before the run.
3. Database pool usage remains bounded; no sustained pool starvation, unbounded queue growth, or lock amplification.
4. Rate limits work consistently across at least two API instances; process-local counters are not accepted as proof.
5. WebSocket reconnects and slow consumers do not exhaust memory or block API request handling.
6. Media remains durable and readable after API instance replacement; local ephemeral storage is not accepted.
7. A controlled instance failure and recovery do not corrupt data or cause unbounded retry storms.
8. The run completes within the pre-approved cost ceiling, and the cost per operation is recorded.
9. The exact test artifacts, dashboards, logs, commit SHA, and infrastructure configuration are retained for review.

## Progressive scale stages

- **Stage A — correctness baseline:** run unit/integration tests, query-plan review, and low-volume smoke tests.
- **Stage B — single-region vertical baseline:** increase load in controlled steps and identify the first saturated resource.
- **Stage C — horizontal API:** use shared rate-limit/session coordination, external durable media, and bounded database pooling; repeat tests across multiple API instances.
- **Stage D — asynchronous workloads:** introduce an outbox and queue for notifications and other retryable side effects; verify idempotency, replay, and dead-letter handling.
- **Stage E — regional resilience:** test regional routing, data ownership/partition boundaries, replication lag, failover, and disaster recovery.
- **Stage F — global scale evidence:** repeat workload tests across regions and publish measured limits, cost curves, and operational staffing requirements. Do not extrapolate a 10-billion-account capacity claim from a small synthetic test.

## Safety and stop conditions

Stop a run immediately on unexpected production traffic impact, data integrity errors, authentication/authorization anomalies, rapidly growing queue depth, database connection exhaustion, uncontrolled provider spend, or resource use beyond the pre-approved ceiling. Never run destructive tests against production.

## Run report template

- Commit SHA and date:
- Environment/region and instance sizes:
- Dataset size and synthetic account count:
- Workload mix and duration:
- Peak achieved throughput:
- p50 / p95 / p99 latency:
- Error and timeout rates:
- Database/cache/queue/WebSocket/storage observations:
- Failure/recovery scenario and result:
- Cost ceiling and measured cost:
- Findings, blockers, and next safe capacity step:
- Reviewer and approval:
