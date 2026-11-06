ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS posts_active_feed_idx
  ON posts (created_at DESC)
  WHERE is_archived = FALSE;
