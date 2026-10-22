-- Opexnal Connect first-party PostgreSQL schema.
-- Run with a database owner/migration role, never from the public app client.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, username VARCHAR(30) NOT NULL UNIQUE CHECK (username ~ '^[a-zA-Z0-9._]{3,30}$'),
  email VARCHAR(254) NOT NULL UNIQUE, password_hash TEXT NOT NULL, display_name VARCHAR(80) NOT NULL,
  avatar_url TEXT, bio TEXT NOT NULL DEFAULT '', website TEXT, location VARCHAR(120),
  locale VARCHAR(12) NOT NULL DEFAULT 'en', timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
  country_code CHAR(2), is_private BOOLEAN NOT NULL DEFAULT TRUE, is_deactivated BOOLEAN NOT NULL DEFAULT FALSE,
  account_type VARCHAR(20) NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal','creator','business')),
  allow_mentions_from VARCHAR(20) NOT NULL DEFAULT 'everyone' CHECK (allow_mentions_from IN ('everyone','followers','none')),
  allow_tags_from VARCHAR(20) NOT NULL DEFAULT 'everyone' CHECK (allow_tags_from IN ('everyone','followers','none')),
  show_activity_status BOOLEAN NOT NULL DEFAULT FALSE,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user','moderator','admin')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE, last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at DESC);
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows (following_id, created_at DESC);
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE TABLE IF NOT EXISTS user_restrictions (
  restrictor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restricted_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (restrictor_id, restricted_id),
  CHECK (restrictor_id <> restricted_id)
);
CREATE TABLE IF NOT EXISTS close_friends (
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, friend_id),
  CHECK (owner_id <> friend_id)
);
CREATE INDEX IF NOT EXISTS close_friends_friend_idx ON close_friends (friend_id, owner_id);
CREATE TABLE IF NOT EXISTS follow_requests (
  id UUID PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, target_id),
  CHECK (requester_id <> target_id)
);
CREATE INDEX IF NOT EXISTS follow_requests_target_idx
  ON follow_requests (target_id, created_at DESC) WHERE status='pending';
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent VARCHAR(512),
  ip_address INET
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_active_idx
  ON auth_sessions (user_id, expires_at DESC) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS websocket_tickets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES auth_sessions(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS websocket_tickets_expiry_idx
  ON websocket_tickets (expires_at) WHERE used_at IS NULL;

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
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
  ON password_reset_tokens (user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption VARCHAR(2200) NOT NULL DEFAULT '', media_url TEXT,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image','video','text')),
  visibility VARCHAR(10) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  location_name VARCHAR(120), comments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (media_type = 'text' OR media_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS posts_feed_idx ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_feed_idx ON posts (user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS post_media (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image','video')),
  width INTEGER CHECK (width IS NULL OR width > 0),
  height INTEGER CHECK (height IS NULL OR height > 0),
  duration_seconds NUMERIC(8,2) CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, position)
);
CREATE INDEX IF NOT EXISTS post_media_post_idx ON post_media (post_id, position);
CREATE TABLE IF NOT EXISTS media_objects (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key VARCHAR(120) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS media_objects_owner_idx
  ON media_objects (owner_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS post_likes_post_idx ON post_likes (post_id);
CREATE TABLE IF NOT EXISTS post_saves (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS post_saves_post_idx ON post_saves (post_id);
CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  channel VARCHAR(40) NOT NULL DEFAULT 'link',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  body VARCHAR(2000) NOT NULL CHECK (length(trim(body)) > 0),
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS post_comments_post_idx ON post_comments (post_id, created_at ASC);
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL, media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image','video')),
  visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','close_friends','private')),
  caption TEXT NOT NULL DEFAULT '', width INTEGER, height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);
CREATE INDEX IF NOT EXISTS stories_expiry_idx ON stories (expires_at DESC);
CREATE INDEX IF NOT EXISTS stories_user_expiry_idx ON stories (user_id, expires_at DESC);
CREATE TABLE IF NOT EXISTS story_views (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (story_id, viewer_id)
);
CREATE INDEX IF NOT EXISTS story_views_story_idx ON story_views (story_id, created_at DESC);
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(12) NOT NULL CHECK (target_type IN ('post','comment','user','story')),
  target_id UUID NOT NULL,
  reason VARCHAR(80) NOT NULL,
  details VARCHAR(2000),
  status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  action_notes VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS content_reports_queue_idx ON content_reports (status, created_at DESC);
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(40),
  target_id VARCHAR(120),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);
CREATE TABLE IF NOT EXISTS story_mutes (
  muter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (muter_id, muted_id),
  CHECK (muter_id <> muted_id)
);
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
