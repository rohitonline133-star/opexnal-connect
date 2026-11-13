-- Secure OTP challenge storage for the first-party PostgreSQL API.
CREATE TABLE IF NOT EXISTS auth_otps (
  id UUID PRIMARY KEY,
  identifier_hash CHAR(64) NOT NULL,
  channel VARCHAR(12) NOT NULL CHECK (channel IN ('email','whatsapp')),
  otp_hash CHAR(64) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS auth_otps_identifier_active_idx
  ON auth_otps (identifier_hash, created_at DESC)
  WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS auth_otps_expiry_idx ON auth_otps (expires_at);
