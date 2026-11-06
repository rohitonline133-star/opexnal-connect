-- Add owner-controlled post archive support.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS posts_owner_archive_idx
  ON posts (user_id, archived_at DESC)
  WHERE archived_at IS NOT NULL;
