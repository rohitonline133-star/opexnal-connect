-- Opexnal Connect first-party PostgreSQL schema.
-- Run with a database owner/migration role, never from the public app client.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, username VARCHAR(30) NOT NULL UNIQUE CHECK (username ~ '^[a-zA-Z0-9._]{3,30}$'),
  email VARCHAR(254) NOT NULL UNIQUE, password_hash TEXT NOT NULL, display_name VARCHAR(80) NOT NULL,
  avatar_url TEXT, email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at DESC);
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx
  ON email_verification_tokens (user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption VARCHAR(2200) NOT NULL DEFAULT '', media_url TEXT,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image','video','text')),
  visibility VARCHAR(10) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (media_type = 'text' OR media_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS posts_feed_idx ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_feed_idx ON posts (user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS post_likes_post_idx ON post_likes (post_id);
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL, media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image','video')),
  visibility VARCHAR(10) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);
CREATE INDEX IF NOT EXISTS stories_expiry_idx ON stories (expires_at DESC);
CREATE INDEX IF NOT EXISTS stories_user_expiry_idx ON stories (user_id, expires_at DESC);
CREATE TABLE IF NOT EXISTS conversations (id UUID PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS conversation_members_user_idx ON conversation_members (user_id, joined_at DESC);
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY, conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body VARCHAR(5000) NOT NULL CHECK (length(body) > 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, created_at ASC);
-- Future migrations required: verification/reset tokens, refresh sessions, MFA, follows,
-- comments, moderation, media storage, unread receipts, audit events and backup policies.
