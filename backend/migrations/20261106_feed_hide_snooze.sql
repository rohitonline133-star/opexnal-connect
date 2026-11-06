-- Persist per-viewer post hiding and 30-day creator snoozes.
CREATE TABLE IF NOT EXISTS hidden_posts (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS hidden_posts_user_idx
  ON hidden_posts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS creator_snoozes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snoozed_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, creator_id),
  CHECK (user_id <> creator_id)
);
CREATE INDEX IF NOT EXISTS creator_snoozes_expiry_idx
  ON creator_snoozes (user_id, snoozed_until);
