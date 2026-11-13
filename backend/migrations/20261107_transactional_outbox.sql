-- Durable event handoff storage for transactional application events.
-- Application producers and the publisher worker live in backend/lib and backend/workers;
-- deploy this migration and worker only after staging database integration tests.
CREATE TABLE IF NOT EXISTS event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(120) NOT NULL,
  event_version SMALLINT NOT NULL DEFAULT 1 CHECK (event_version > 0),
  aggregate_type VARCHAR(80) NOT NULL,
  aggregate_id UUID NOT NULL,
  idempotency_key VARCHAR(180) NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'published', 'dead')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by VARCHAR(120),
  last_error_code VARCHAR(80),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (status = 'processing' AND locked_at IS NOT NULL AND locked_by IS NOT NULL)
    OR status <> 'processing'
  ),
  CHECK (
    (status = 'published' AND published_at IS NOT NULL)
    OR status <> 'published'
  )
);

-- Workers should claim due pending rows in small batches using
-- FOR UPDATE SKIP LOCKED, then mark completion or schedule a bounded retry.
CREATE INDEX IF NOT EXISTS event_outbox_pending_idx
  ON event_outbox (available_at, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS event_outbox_processing_idx
  ON event_outbox (locked_at)
  WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS event_outbox_aggregate_idx
  ON event_outbox (aggregate_type, aggregate_id, created_at DESC);

-- Keep payloads minimal: never place passwords, access tokens, OTP values,
-- raw email/phone identifiers, private message bodies, or media bytes here.
