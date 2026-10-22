# Opexnal Connect — independent API

First-party Node.js/Express API with PostgreSQL persistence, JWT access tokens, and WebSocket notifications. No Supabase Auth or database SDK is used by this backend.

## Local setup

Requirements: Node.js 22+, PostgreSQL 15+.

1. Copy .env.example to .env and set DATABASE_URL and a unique JWT_SECRET of at least 32 characters.
2. Configure a self-hosted SMTP server using SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, and PUBLIC_API_URL. Signup deliberately returns 503 and creates no account when email verification delivery is not configured.
3. Install dependencies at repository root with npm install.
4. Create a PostgreSQL database and run: psql "$DATABASE_URL" -f backend/schema.sql
5. Start the API with npm run backend:start; health check: GET http://localhost:4000/health.

## Endpoints

- POST /api/v1/auth/signup — username/email/password registration (password hashed using Node scrypt); requires SMTP delivery and a 13+ date of birth.
- GET /api/v1/auth/verify-email?token=… — consumes a 30-minute single-use email verification token.
- POST /api/v1/auth/login — returns a short-lived HS256 JWT only after email verification.
- GET /api/v1/auth/me, POST /api/v1/auth/logout.
- GET /api/v1/posts/feed, POST /api/v1/posts.
- GET/POST /api/v1/stories — stories expire after 24 hours.
- GET /api/v1/reels — video posts.
- GET/POST /api/v1/messages/conversations, GET/POST /api/v1/messages/:conversationId.
- GET /health; WebSocket endpoint /ws?token=<JWT>, emits message.created events.

## Deployment boundary

The frontend and API are separate processes. Deploy the API on a Node.js host that supports long-lived WebSocket connections and configure OPEXNAL_API_URL on the web server to that public HTTPS API origin. The TanStack server proxies /api/v1/* requests to this fixed configured origin; it does not accept user-supplied proxy targets. The current Vercel/TanStack server does not automatically proxy traffic to this Express process. The app's old local-storage adapter is not yet fully migrated to these endpoints; this is not a completed production migration.

## Not yet production complete

- Email verification uses the configured SMTP server and expiring, single-use hashed tokens. Password reset and phone OTP still need their own delivery and token flows.
- JWT refresh-token rotation/revocation and durable session management are not implemented.
- WebSocket authorization currently validates JWT identity; it only broadcasts messages created through authenticated REST routes.
- Add distributed rate limiting (Redis), request validation, production origin configuration, media storage, security tests, monitoring, backups, and load testing before public launch.
- Never commit .env or production credentials.
