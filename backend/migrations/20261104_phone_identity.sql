-- Add phone-based account identity while preserving existing email accounts.
-- Existing users remain unchanged; phone numbers are stored in E.164 format.
ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_e164 VARCHAR(16),
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS username_is_generated BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_contact_method_required'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_contact_method_required
      CHECK (email IS NOT NULL OR phone_e164 IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_e164_format'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_phone_e164_format
      CHECK (phone_e164 IS NULL OR phone_e164 ~ E'^\\+[1-9][0-9]{7,14}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_e164_unique
  ON users (phone_e164)
  WHERE phone_e164 IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_phone_verified_idx
  ON users (phone_e164, phone_verified)
  WHERE phone_e164 IS NOT NULL;

-- One-time phone verification challenges. Only a keyed hash of the OTP is stored.
CREATE TABLE IF NOT EXISTS phone_verification_challenges (
  id UUID PRIMARY KEY,
  phone_e164 VARCHAR(16) NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS phone_verification_lookup_idx
  ON phone_verification_challenges (phone_e164, created_at DESC)
  WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS phone_verification_expiry_idx
  ON phone_verification_challenges (expires_at);
