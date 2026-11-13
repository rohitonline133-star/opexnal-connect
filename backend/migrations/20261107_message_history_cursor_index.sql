-- Supports reverse-chronological message history keyset pagination.
CREATE INDEX IF NOT EXISTS messages_conversation_cursor_idx
  ON messages (conversation_id, created_at DESC, id DESC);
