-- Shared fixed-window rate-limit buckets for horizontally scaled API instances.
-- Only HMAC bucket hashes are stored; raw IP/account-derived keys are not persisted.
CREATE TABLE IF NOT EXISTS distributed_rate_limits (
  bucket_hash CHAR(64) PRIMARY KEY CHECK (bucket_hash ~ '^[0-9a-f]{64}$'),
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  CHECK (expires_at > window_started_at)
);
CREATE INDEX IF NOT EXISTS distributed_rate_limits_expiry_idx
  ON distributed_rate_limits (expires_at);
