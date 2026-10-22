-- Add follow graph and follower-only post visibility for existing databases.
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows (following_id, created_at DESC);
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_visibility_check;
ALTER TABLE posts ADD CONSTRAINT posts_visibility_check CHECK (visibility IN ('public','followers','private'));
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_visibility_check;
ALTER TABLE stories ADD CONSTRAINT stories_visibility_check CHECK (visibility IN ('public','followers','private'));

-- Idempotent migration for existing Opexnal PostgreSQL deployments.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_name VARCHAR(120);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN NOT NULL DEFAULT TRUE;

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
