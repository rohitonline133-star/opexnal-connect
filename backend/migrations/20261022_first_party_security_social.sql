-- Add persistent profile fields for existing databases.
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale VARCHAR(12) NOT NULL DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(80) NOT NULL DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code CHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'personal';
ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_mentions_from VARCHAR(20) NOT NULL DEFAULT 'everyone';
ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_tags_from VARCHAR(20) NOT NULL DEFAULT 'everyone';
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_activity_status BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user','moderator','admin'));
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(12) NOT NULL CHECK (target_type IN ('post','comment','user','story','message')),
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
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_type_check;
ALTER TABLE users ADD CONSTRAINT users_account_type_check CHECK (account_type IN ('personal','creator','business'));
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_allow_mentions_from_check;
ALTER TABLE users ADD CONSTRAINT users_allow_mentions_from_check CHECK (allow_mentions_from IN ('everyone','followers','nobody'));
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_allow_tags_from_check;
ALTER TABLE users ADD CONSTRAINT users_allow_tags_from_check CHECK (allow_tags_from IN ('everyone','followers','nobody'));

-- Add follow graph and follower-only post visibility for existing databases.
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
ALTER TABLE stories ADD COLUMN IF NOT EXISTS caption TEXT NOT NULL DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_visibility_check;
ALTER TABLE stories ADD CONSTRAINT stories_visibility_check CHECK (visibility IN ('public','followers','close_friends','private'));
CREATE TABLE IF NOT EXISTS story_views (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (story_id, viewer_id)
);
CREATE INDEX IF NOT EXISTS story_views_story_idx ON story_views (story_id, created_at DESC);
CREATE TABLE IF NOT EXISTS story_mutes (
  muter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (muter_id, muted_id),
  CHECK (muter_id <> muted_id)
);
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


-- Persist message read receipts and conversation ordering.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS message_reactions (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notification_type VARCHAR(40) NOT NULL,
  target_type VARCHAR(20),
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications (recipient_id, created_at DESC);
