-- Persist owner preference for hiding a post's like count.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS hide_likes_count BOOLEAN NOT NULL DEFAULT FALSE;
