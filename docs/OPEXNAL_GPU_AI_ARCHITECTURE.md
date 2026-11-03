# Opexnal GPU AI Infrastructure — staged build plan

## What this adds
This repository now has a GPU inference Compose stack in `deploy/ai-gpu/compose.yaml`:
- vLLM OpenAI-compatible chat inference on a NVIDIA GPU host.
- An isolated Ollama service intended for local embeddings.
- A private Docker network and persistent model caches.
- No published public ports for either model service.
- API-key protection on the vLLM endpoint.

**This is deployment configuration, not a running server.** It does not buy/provision GPUs, configure DNS, install the host driver, pull model weights, or prove successful inference. The adapter has now been updated on this draft branch to support a separate vLLM chat endpoint and Ollama `/api/embed` endpoint. This code has not yet passed CI, and this Compose file intentionally contains model services only (not the Opexnal web app or HTTPS reverse proxy). Do not call this production-integrated until CI passes and the app is attached to the same private network or another authenticated private network path is configured.

## Hardware tiers (practical, not rack-scale)
- **Development / smoke test:** one NVIDIA GPU with enough VRAM for the chosen quantized model; 16 GB VRAM is a reasonable starting target for a 7B AWQ model, but actual usage depends on context length, batch size, CUDA/vLLM versions, and concurrent users.
- **Higher-throughput production:** GPU with 24–48 GB VRAM, 64–128 GB host RAM, fast NVMe, reliable bandwidth, monitoring and backups. Size by measured tokens/sec and concurrency, not by brand name alone.
- **Frontier-scale cluster:** GB200/B200 NVL72 or MI300X/MI325X-class systems, high-speed fabric, liquid cooling, redundant power and data-center operations require specialist procurement and infrastructure. This repository cannot provision or emulate that hardware.

## Host prerequisites
1. Linux x86-64 host with supported NVIDIA GPU and a compatible NVIDIA driver.
2. Docker Engine + Docker Compose v2 + NVIDIA Container Toolkit.
3. Sufficient disk for model caches; reserve additional space for logs and upgrades.
4. Firewall: allow SSH only from trusted IPs and HTTPS for the application. Do not publish ports 8000 or 11434 directly.
5. Generate a private API key: `openssl rand -hex 32`.
6. Copy `.env.example` to `.env`, set a real secret, and protect it with `chmod 600 .env`.

## Start and verify on the GPU host
From repository root:
```bash
cp deploy/ai-gpu/.env.example deploy/ai-gpu/.env
# Edit deploy/ai-gpu/.env and set OPEX_AI_API_KEY.
chmod 600 deploy/ai-gpu/.env
docker compose --env-file deploy/ai-gpu/.env -f deploy/ai-gpu/compose.yaml up -d
docker compose --env-file deploy/ai-gpu/.env -f deploy/ai-gpu/compose.yaml ps
docker compose --env-file deploy/ai-gpu/.env -f deploy/ai-gpu/compose.yaml logs -f vllm
```
After vLLM becomes healthy, pull the embedding model with `docker compose --env-file deploy/ai-gpu/.env -f deploy/ai-gpu/compose.yaml exec embeddings ollama pull nomic-embed-text`. The Opexnal app runtime must set `OPEX_AI_MODEL_ENDPOINT=http://vllm:8000/v1`, `OPEX_AI_MODEL_NAME=opexnal-qwen-7b`, `OPEX_AI_API_KEY` to the same secret as the vLLM service, `OPEX_AI_EMBEDDING_ENDPOINT=http://embeddings:11434`, and `OPEX_AI_EMBEDDING_MODEL=nomic-embed-text`. These internal hostnames only resolve for containers attached to this Compose network. The app is not part of this Compose file yet, so production wiring requires joining the app to this private network or using a securely configured private network path. Test real inference from the app before directing users to it.

## Phased architecture
1. **Single GPU inference:** vLLM + quantized instruct model; measure latency, tokens/sec, VRAM and error rates.
2. **App integration:** update the Opexnal adapter to support separate chat and embedding endpoints, verify auth and health checks, then run integration tests. Do not point production traffic to the GPU stack until this is complete.
3. **Security and reliability:** TLS reverse proxy, secret rotation, request limits, rate limits, audit-safe logs, monitoring, backups, restart/reboot recovery and load testing.
4. **Scale-out:** only after measurement, add Kubernetes for serving/orchestration and autoscaling; use Slurm for batch training jobs. Redis may be added for shared rate limits/queues if the application requires it.
5. **Distributed training:** separate project and budget. Fine-tuning a suitable open-weight model is realistic before attempting to train a foundation model from scratch.

## Honest limitations
- A high-end rack is not a software-only installation and cannot be created by a Git commit.
- GPU cloud rental/purchase and data-center power/cooling are separate costs.
- Model licenses and acceptable-use terms must be reviewed before commercial launch.
- A healthy container is not proof of a good model response. Run an authenticated inference request and app-level test.
- Current CI has failed automated tests; fix those failures before production release.
\n\n## Current deployment blockers\n- The GPU services Compose stack does not provision a cloud VM or install GPU drivers/toolkit.\n- The Opexnal web app is not yet included in this Compose stack, so internal service DNS is not reachable from a separate Vercel deployment.\n- GitHub Actions automated tests currently fail (12 failures in the observed run); do not merge or deploy as production until fixed and rerun.\n