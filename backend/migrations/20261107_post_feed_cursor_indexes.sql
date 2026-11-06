-- Stable home-feed and profile-post keyset access paths.
CREATE INDEX IF NOT EXISTS posts_active_feed_cursor_idx
  ON posts (created_at DESC, id DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS posts_user_active_feed_cursor_idx
  ON posts (user_id, created_at DESC, id DESC)
  WHERE archived_at IS NULL;
