# Opexnal Data-Flow Inventory — Engineering Baseline

**Status:** Initial code-review inventory; incomplete and not a privacy certification.
**Reviewed source:** `backend/server.js`, `src/server/auth-handler.ts`, and repository paths visible on the review date.
**Rule:** Do not publish a privacy notice, claim compliance, or enable a new market based only on this document. Product owners and qualified privacy counsel must verify every flow, deployment setting, vendor, retention period, and legal basis.

## 1. Flows directly observed in source

| Data / event | Observed handling | Evidence / unresolved questions |
|---|---|---|
| Account identity | Signup accepts username, email, display name and date of birth; stores user account data in PostgreSQL. | Confirm complete schema, purpose, visibility, correction/export/deletion paths and retention. |
| Passwords | Backend hashes passwords with Node.js scrypt and random salt; plaintext should not be persisted. | Verify parameter configuration, migration compatibility, reset lifecycle and operational access. |
| Email verification | Verification token is generated, hashed for storage, expires after 30 minutes, and delivery uses configured SMTP transport. | Identify actual SMTP provider, region, DPA, transfer safeguards, logs and retention. |
| Authentication sessions | Session rows store user ID, expiry, user-agent (up to 512 chars) and request IP. | Define purpose, access, retention/deletion schedule, proxy/IP accuracy and user disclosure. |
| Account recovery | Stores account reference when found, HMAC identity hash, hashed ticket token, reason and optional details (up to 1,000 chars); requests are rate-limited. | Confirm database expiry cleanup, staff access, support processor, deletion schedule and disclosure. |
| User media | Upload code accepts selected image/video MIME types, stores files under configurable local media directory, limit 100 MB per file. | Verify actual production storage, region, encryption, malware scanning, metadata/EXIF handling, CDN/cache copies, access control and deletion propagation. |
| Social content and notifications | Backend writes notification records and metadata to PostgreSQL. | Inventory all content tables, private messages, attachments, visibility, moderation evidence and retention. |
| Database | Backend connects through `DATABASE_URL` using PostgreSQL; TLS is conditional on `DATABASE_SSL=true`. | Confirm production setting is enforced, hosting provider/region, backups, replicas, admin access, encryption at rest and contract. |
| Network / request metadata | Rate limiting uses request IP in keys; session records persist IP and user-agent. | Determine proxy trust configuration, log collection by hosting/CDN, retention, minimization and notice. |

## 2. Controls and gaps that need verification

- No complete vendor/subprocessor inventory has yet been established from this source review.
- No verified production database, object-storage, SMTP, CDN, analytics, crash-reporting, payment, SMS or AI-provider configuration is included here.
- No verified global retention schedule or end-to-end deletion evidence is available in this review.
- Confirm whether request logs, application logs, monitoring, backups and security telemetry contain personal data.
- Map every client permission and collection event (camera, microphone, photos, contacts, location, device identifiers).
- Review all AI features for prompts, uploads, outputs, provider routing, logging, training settings and cross-border transfers.
- Review messaging encryption claims and actual message/attachment access.
- Verify data-subject request workflows end-to-end, including backups and subprocessors.
- Confirm production PostgreSQL TLS is mandatory, not merely optional by environment flag.
- Confirm media storage is durable, private by default, region-controlled and deletable across CDN/cache copies.

## 3. Required completion evidence

For each processing activity, record: controller/operator, purpose, data categories, data subjects, collection point, lawful basis, recipients/processors, storage country, transfer mechanism, retention period, deletion method, security controls, user notice, rights workflow, owner and evidence link.

Before market approval, obtain counsel review of the completed data map and privacy impact assessment where required. Any missing or unverified field remains **UNKNOWN / NOT REVIEWED**; it must not be silently treated as compliant.

## 4. Immediate engineering backlog

- [ ] Inventory every database table and API endpoint that reads or writes personal data.
- [ ] Identify all configured vendors from deployment manifests and production settings without exposing secrets.
- [ ] Add a documented retention schedule and automated cleanup jobs with tests.
- [ ] Test account export, correction, deletion and consent withdrawal across all stores.
- [ ] Verify PostgreSQL TLS and storage encryption in production.
- [ ] Verify upload scanning, metadata minimization, access control and deletion.
- [ ] Document proxy/CDN request logging and configure trusted proxy handling.
- [ ] Complete AI, analytics, crash, email, SMS and payment data-flow assessments.
- [ ] Obtain qualified privacy counsel sign-off per target jurisdiction.

This inventory is a point-in-time engineering observation, not legal advice or a complete statement of actual production processing.
