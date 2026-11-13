-- Supports stable inbox pagination by most-recent activity.
CREATE INDEX IF NOT EXISTS conversations_activity_cursor_idx
  ON conversations (last_message_at DESC, id DESC);

-- Supports finding a user's conversation memberships without scanning other members.
CREATE INDEX IF NOT EXISTS conversation_members_user_conversation_idx
  ON conversation_members (user_id, conversation_id);
