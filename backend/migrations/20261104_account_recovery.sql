-- Persist recovery requests without storing the submitted account identifier or raw tracking token.
CREATE TABLE IF NOT EXISTS account_recovery_requests (
  id UUID PRIMARY KEY,
  account_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  identity_hash CHAR(64) NOT NULL,
  ticket_token_hash CHAR(64) NOT NULL UNIQUE,
  reason VARCHAR(32) NOT NULL CHECK (reason IN (
    'account_takeover','lost_email','lost_phone','suspicious_login','forgot_password','other'
  )),
  details VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received','manual_review','resolved','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);
CREATE INDEX IF NOT EXISTS account_recovery_requests_user_idx
  ON account_recovery_requests (account_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS account_recovery_requests_created_idx
  ON account_recovery_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS account_recovery_requests_expiry_idx ON account_recovery_requests (expires_at);
