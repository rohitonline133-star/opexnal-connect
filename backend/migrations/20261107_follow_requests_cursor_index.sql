-- Supports stable keyset pagination for pending follow requests.
-- Apply after backend/schema.sql and the first-party social migrations.
CREATE INDEX IF NOT EXISTS follow_requests_pending_cursor_idx
  ON follow_requests (target_id, created_at DESC, id DESC)
  WHERE status = 'pending';
