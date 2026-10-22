# Opexnal Connect — independent API

First-party Node.js/Express API with PostgreSQL persistence, JWT access tokens, and WebSocket notifications. No Supabase Auth or database SDK is used by this backend.

## Local setup

Requirements: Node.js 22+, PostgreSQL 15+.

1. Copy .env.example to .env and set DATABASE_URL and a unique JWT_SECRET of at least 32 characters.
2. Install dependencies at repository root with npm install.
3. Create a PostgreSQL database and run: psql "$DATABASE_URL" -f backend/schema.sql
4. Start the API with npm run backend:start; health check: GET http://localhost:4000/health.

## Endpoints

- POST /api/v1/auth/signup — username/email/password registration (password hashed using Node scrypt).
- POST /api/v1/auth/login — returns a short-lived HS256 JWT.
- GET /api/v1/auth/me, POST /api/v1/auth/logout.
- GET /api/v1/posts/feed, POST /api/v1/posts.
- GET/POST /api/v1/stories — stories expire after 24 hours.
- GET /api/v1/reels — video posts.
- GET/POST /api/v1/messages/conversations, GET/POST /api/v1/messages/:conversationId.
- POST /api/v1/auth/ws-ticket — authenticated endpoint that issues a 30-second, single-use WebSocket ticket.
- GET /health; WebSocket endpoint `/ws?ticket=<single-use-ticket>`, emits `message.created` events. Do not put bearer JWTs in WebSocket URLs. Request a ticket with the access token, then connect immediately; the ticket is consumed during the handshake.

## Deployment boundary

The frontend and API are separate processes. Deploy the API on a Node.js host that supports long-lived WebSocket connections and configure the frontend API base URL (VITE_OPEXNAL_API_URL) to that public HTTPS origin. The current Vercel/TanStack server does not automatically proxy traffic to this Express process. The app's old local-storage adapter is not yet fully migrated to these endpoints; this is not a completed production migration.

## Not yet production complete

- Email confirmation/reset and phone OTP need a real mail/SMS provider and expiring, single-use tokens.
- JWT refresh-token rotation/revocation and durable session management are not implemented.
- WebSocket authorization currently validates JWT identity; it only broadcasts messages created through authenticated REST routes.
- Add distributed rate limiting (Redis), request validation, production origin configuration, media storage, security tests, monitoring, backups, and load testing before public launch.
- Never commit .env or production credentials.
