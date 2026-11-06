-- Read-only feed/profile query-plan diagnostics.
-- Use a staging database and a dedicated test account; EXPLAIN ANALYZE executes SELECTs.
-- Supply psql variable: -v target_user_id='<UUID>'
BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';

-- Home feed candidate ordering and active-post predicate.
EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT p.id,p.user_id,p.created_at
FROM posts p
WHERE p.archived_at IS NULL
  AND (p.created_at,p.id)<(NOW(), 'ffffffff-ffff-4fff-bfff-ffffffffffff'::uuid)
ORDER BY p.created_at DESC,p.id DESC
LIMIT 21;

-- Profile timeline access path for one account.
EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT p.id,p.created_at
FROM posts p
WHERE p.user_id = :'target_user_id'::uuid
  AND p.archived_at IS NULL
  AND (p.created_at,p.id)<(NOW(), 'ffffffff-ffff-4fff-bfff-ffffffffffff'::uuid)
ORDER BY p.created_at DESC,p.id DESC
LIMIT 19;

ROLLBACK;
