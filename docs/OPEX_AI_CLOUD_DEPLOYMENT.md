# Opexnal AI — 24×7 cloud deployment

This stack runs the Opexnal app and the Ollama model server on one Ubuntu VPS. Ollama is on a private Docker network and has **no public host port**. Caddy terminates HTTPS on ports 80/443.

## Important status

Adding these files does not provision a VPS or make the AI live. A cloud VM, DNS, secrets, model download, successful inference, and an end-to-end app test are still required. Do not point production users at this stack until those checks pass.

## Recommended starter

- Ubuntu 24.04 LTS x86-64 VPS with Docker Compose v2.
- Start with at least 4 vCPU and 8 GB RAM for the small `llama3.2:1b` test model; 16 GB RAM is a safer headroom target. CPU inference can be slow. GPU hosting costs more.
- Budget depends on provider, region, storage, egress and uptime; confirm the provider's live price before purchase.
- This starter is for low-volume smoke testing, not a claim of production-scale capacity.

## 1. Prepare the server

1. Create an Ubuntu VPS in your chosen cloud account and point a domain/subdomain (for example `ai.your-domain.example`) to the server's public IPv4 address.
2. Configure the firewall to allow inbound TCP 22 only from your trusted IP, plus TCP 80 and 443. Do **not** open 11434 or 3000 publicly.
3. Install Docker Engine and the Docker Compose plugin using Docker's official Ubuntu instructions.
4. Clone this repository and check out branch `independent-backend-20261016`.

## 2. Configure secrets

Create a root-level `.env.production` file on the server only; never commit it:

```dotenv
ACME_EMAIL=admin@your-real-domain.example
OPEXNAL_DOMAIN=ai.your-real-domain.example
# Add the existing app's required production variables here, using unique secrets.
# Do not put a Gemini/OpenAI/other hosted AI API key here.
```

Protect it with `chmod 600 .env.production`. Confirm all non-AI required variables for this repository before launch. The sample compose file uses the app Dockerfile and may need adjustments if the app's production entrypoint changes.

## 3. Start the stack

```bash
docker compose --env-file .env.production -f deploy/ollama/compose.cloud.yaml up -d --build
docker compose --env-file .env.production -f deploy/ollama/compose.cloud.yaml ps
docker compose --env-file .env.production -f deploy/ollama/compose.cloud.yaml exec ollama ollama pull llama3.2:1b
docker compose --env-file .env.production -f deploy/ollama/compose.cloud.yaml exec ollama ollama pull nomic-embed-text
```

The app waits for the Ollama container health check, but the model must still be downloaded before a real inference test. For a first run, watch resource use with `docker stats`.

## 4. Verify actual model inference

```bash
docker compose -f deploy/ollama/compose.cloud.yaml exec ollama ollama run llama3.2:1b "Reply with exactly: OPEXNAL_AI_OK"
```

Then call the app's authenticated or intended test AI route through the HTTPS domain and confirm the returned model response is non-empty. Also verify the app's logs contain no external AI provider requests. Do not count a health endpoint alone as proof of inference.

## 5. Operational checks before production

- Test reboot recovery: `sudo reboot`, then verify all containers and inference recover.
- Verify HTTPS, auth, rate limiting, request-size limits and logs.
- Back up app data separately; model weights in the Docker volume are not user-data backups.
- Monitor CPU/RAM/disk and set provider billing alerts.
- Use a staging domain and test account first.
- Do not expose Ollama's port 11434 directly. It has no built-in user authentication in this setup; it is private on the Docker network.

## Current limitation

The existing Vercel deployment cannot reach `127.0.0.1` on this VPS. For this compose layout, the app must be served from the same VPS (or the model connection must be provided through a properly authenticated private network). Do not set a Vercel environment variable to a localhost address and expect it to work.
