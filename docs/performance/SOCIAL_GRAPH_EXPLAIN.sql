-- Read-only query-plan diagnostics for social graph access paths.
-- Run with psql variables supplied from a non-production test account:
-- psql "$DATABASE_URL" -v target_user_id='<uuid>' -f docs/performance/SOCIAL_GRAPH_EXPLAIN.sql
-- EXPLAIN ANALYZE executes each SELECT. Use a staging database first; do not
-- run during peak traffic on production without a DBA-approved window.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';

-- Recent followers of an account (incoming edges).
EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT follower_id, created_at
FROM follows
WHERE following_id = :'target_user_id'::uuid
ORDER BY created_at DESC, follower_id DESC
LIMIT 31;

-- Recent accounts followed by an account (outgoing edges).
EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT following_id, created_at
FROM follows
WHERE follower_id = :'target_user_id'::uuid
ORDER BY created_at DESC, following_id DESC
LIMIT 31;

-- Pending incoming follow requests.
EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT id, requester_id, created_at
FROM follow_requests
WHERE target_id = :'target_user_id'::uuid
  AND status = 'pending'
ORDER BY created_at DESC, id DESC
LIMIT 31;

-- Reverse block lookup used by privacy filters.
EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT blocker_id
FROM user_blocks
WHERE blocked_id = :'target_user_id'::uuid
LIMIT 31;

ROLLBACK;
