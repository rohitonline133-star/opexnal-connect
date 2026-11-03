# Opexnal — no-purchase, local-first build plan

**Chosen constraint:** no hardware purchases, no rented GPU/cloud, and no paid inference API. Use only hardware already owned. This is a software and deployment plan; it does not claim that a server or model is already running.

## What can be built now
1. **Opexnal application:** continue developing the existing web app and backend in this repository.
2. **Local AI runtime adapter:** keep model access behind the existing server-side AI gateway. No API key or model endpoint may be exposed to browser code.
3. **Local development path:** run the app and backend on an existing computer if available. Android/Termux can edit and run parts of the Node.js app, but a large LLM may be too slow or may not fit in phone RAM.
4. **Small-model inference:** use an open-weight model only if it fits existing hardware and its licence permits the intended use. Prefer a small quantized model for initial testing. Downloading model weights requires an internet connection and local storage; this is not a paid API, but it is not zero-data or zero-power.
5. **Verification:** tests must distinguish “configured” from “running.” Mark AI as unavailable until a real local inference request succeeds.

## Local-only architecture
```text
Browser / mobile UI
       |
       v
Opexnal app + authenticated backend
       |
       v
Server-side AI gateway (auth, limits, validation)
       |
       v
Local inference process on the same owned device/LAN
       |
       v
Open-weight model files stored locally
```

Do not expose an inference port directly to the public internet. For a same-device test, bind the model server to loopback. For a LAN test, use a private network and firewall rules; do not port-forward it to the internet.

## Pick the runtime based on hardware you already own
- **Android only / Termux:** continue app development and tests; a tiny quantized model may be possible with a compatible llama.cpp build, but model loading and generation depend on device RAM, storage, CPU, and Android restrictions. Do not expect 7B-class or frontier-scale performance.
- **Existing Linux/Windows/macOS computer without a supported GPU:** try a small CPU quantized model. Expect lower throughput. Keep context length and concurrent requests small.
- **Existing computer with a compatible NVIDIA GPU:** a local vLLM or llama.cpp path may be appropriate after checking GPU/VRAM, drivers, and model compatibility. Do not run the GPU Compose stack blindly on Android or a CPU-only host.
- **No usable compute device:** software and tests can still be prepared, but real local model inference cannot be truthfully demonstrated until a suitable existing device is available.

## No-purchase milestones
### Milestone 1 — code integrity
- Install dependencies on the available development device.
- Run npm run typecheck, npm run backend:check, and npm test.
- Record each result as PASS or FAIL with command output. Do not treat an unexecuted test as PASS.

### Milestone 2 — backend and data
- Use a local development database if the current backend requires PostgreSQL.
- Keep secrets in ignored local .env files; commit only .env.example with placeholders.
- Test authentication, authorization, per-user data isolation, rate limits, and error handling.

### Milestone 3 — local AI smoke test
- Select a model compatible with the actual owned device.
- Start inference bound to loopback.
- Run one authenticated prompt and one embedding request if embeddings are needed.
- Record model ID, hardware, latency, exit status, and redacted logs.
- If the model cannot load, show a clear “local AI unavailable” error; never return a fabricated answer as if it came from an LLM.

### Milestone 4 — app integration
- Connect the server-side gateway to the verified local runtime.
- Add a timeout, request-size limit, bounded concurrency, and safe error responses.
- Add integration tests for success, unavailable model, timeout, invalid output, and unauthorized access.
- Do not mark the AI feature live until these tests pass.

### Milestone 5 — safe access
- Keep local inference private by default.
- Do not expose the phone or computer as a public production server without appropriate security, reliable connectivity, uptime, backups, and monitoring.
- A public social app for real users requires reliable hosting and operational resources. Under the no-purchase/no-cloud constraint, the immediate target is local development and a private demo, not a promise of global production availability.

## Current known blockers
- The repository has a GPU-oriented Compose configuration, but this does not create hardware or start a server.
- Prior observed CI status included a Vercel build failure and automated test failures; current success has not been established.
- The production AI path, database connectivity, and end-to-end local inference must be retested from the current branch.
- No live model, public service, or production readiness is claimed by this document.

## Completion evidence template
| Check | Status | Evidence |
|---|---|---|
| Typecheck | NOT RUN | Attach exact command output |
| Backend syntax | NOT RUN | Attach exact command output |
| Unit/integration tests | NOT RUN | Attach test summary |
| Local model starts | NOT VERIFIED | Device/model details required |
| Real chat inference | NOT VERIFIED | Redacted request/response and latency |
| Embeddings | NOT VERIFIED | Model name and dimensions |
| App-to-model integration | NOT VERIFIED | Integration test output |
| Public production readiness | NOT VERIFIED | Requires separate security/reliability review |
