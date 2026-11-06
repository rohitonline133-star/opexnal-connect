-- Persist owner-controlled visibility preferences for post engagement counts.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS hide_likes_count BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_share_count BOOLEAN NOT NULL DEFAULT FALSE;
