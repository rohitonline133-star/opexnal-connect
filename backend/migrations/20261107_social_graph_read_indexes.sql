-- Read-path indexes for reverse social-graph lookups.
-- These are additive and safe to apply repeatedly; review lock/runtime impact
-- against production table sizes before running on a live database.
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx
  ON user_blocks (blocked_id, blocker_id);

CREATE INDEX IF NOT EXISTS user_restrictions_restricted_idx
  ON user_restrictions (restricted_id, restrictor_id);

CREATE INDEX IF NOT EXISTS follow_requests_requester_status_idx
  ON follow_requests (requester_id, status, created_at DESC);

-- Supports recent outgoing follows without scanning the full follower edge set.
CREATE INDEX IF NOT EXISTS follows_follower_created_idx
  ON follows (follower_id, created_at DESC);
