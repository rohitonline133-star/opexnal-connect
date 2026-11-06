-- Stable keyset pagination for a user's notification timeline.
CREATE INDEX IF NOT EXISTS notifications_recipient_cursor_idx
  ON notifications (recipient_id, created_at DESC, id DESC);
