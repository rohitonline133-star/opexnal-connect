# Opexnal independent deployment

This repository no longer requires Vercel for its own build/deployment workflow. The Vercel project and checks are account-level integrations and must be disconnected/removed in Vercel/GitHub settings by an owner; repository code cannot revoke those external integrations.

## Docker Compose (VPS)

1. Install Docker Engine and Docker Compose on an Ubuntu VPS.
2. Copy `.env.example` to `.env`; set a unique random `JWT_SECRET` (32+ characters), a strong `POSTGRES_PASSWORD`, and `CORS_ORIGINS` to the exact public web origin.
3. Set `VITE_OPEXNAL_API_URL` to the public HTTPS API URL before building the web image. Vite variables are compiled into the frontend at build time.
4. Run `docker compose up --build -d`, then `docker compose ps` and `docker compose logs -f api web`.
5. Put a reverse proxy (Caddy/Nginx) with HTTPS in front of web/API. Do not expose PostgreSQL publicly. Configure firewall, monitoring and encrypted off-host backups.

The schema is applied automatically only when PostgreSQL initializes an empty volume. Existing volumes need a deliberate migration procedure; do not delete the database volume to rerun the schema.

## Render

Use the Blueprint in `render.yaml`. Configure `VITE_OPEXNAL_API_URL` with the deployed API URL and `CORS_ORIGINS` with the deployed frontend origin. Set environment variables in the provider dashboard, never commit secrets.

## Current limitations — not a complete Instagram replacement

The API currently provides starter auth, feed/post creation, 24-hour stories, video/reel listing and conversation/message endpoints with WebSocket notifications. Email delivery, refresh-session revocation, distributed rate limiting, follows/comments, media upload/storage/CDN, moderation, admin RBAC, backup automation and full mobile clients require additional implementation and testing. Do not treat this starter as production-certified until integration, security and load tests pass.

## Lockfile

There is currently no `package-lock.json` tracked on the independent backend branch. CI and Docker resolve dependencies from `package.json` using `npm install`. Generate and commit a real lockfile with Node/npm on a machine with npm registry access (`npm install --package-lock-only`) before switching CI to `npm ci`; do not fabricate a lockfile by hand.
