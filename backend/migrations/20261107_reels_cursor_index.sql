-- Supports the authenticated, visibility-filtered Reels keyset feed.
-- Apply through the normal migration process; do not run manually in production.
CREATE INDEX IF NOT EXISTS posts_active_video_reels_cursor_idx
  ON posts (created_at DESC, id DESC)
  WHERE archived_at IS NULL AND media_type = 'video';
