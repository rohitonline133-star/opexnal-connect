-- Stable keyset-pagination indexes for both directions of the follow graph.
-- Keep cursor ordering deterministic when many edges share the same timestamp.
-- Review lock/runtime impact and validate with EXPLAIN on a staging-sized dataset.
CREATE INDEX IF NOT EXISTS follows_following_cursor_idx
  ON follows (following_id, created_at DESC, follower_id DESC);

CREATE INDEX IF NOT EXISTS follows_follower_cursor_idx
  ON follows (follower_id, created_at DESC, following_id DESC);
