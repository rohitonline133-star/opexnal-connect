-- Persist owner-controlled pinning of posts on creator profiles.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS posts_profile_pinned_idx
  ON posts (user_id, is_pinned DESC, created_at DESC)
  WHERE archived_at IS NULL;
