# Opexnal AI — self-hosted model deployment

Opexnal AI is configured to use an Opexnal-controlled inference server only. It must not silently route prompts to Gemini or another hosted AI vendor. The application returns HTTP 503 when the first-party model server is missing or unavailable; this is intentional and honest, not a fake AI answer.

## 1. Requirements

- A Linux host or computer you control with Docker Compose installed.
- Enough RAM/CPU for the selected quantized model. A small model is a prototype, not a frontier-scale model.
- The Opexnal API process must be able to reach the inference server over a private network.
- Do not expose Ollama's port 11434 directly to the public internet.

## 2. Start a local model server

From the repository root:

```sh
docker compose -f deploy/ollama/compose.yaml up -d
docker exec opexnal-ollama ollama pull llama3.2:1b
docker exec opexnal-ollama ollama list
```

The first model download needs internet, but prompts/inference are sent to the Ollama process you control after the model is downloaded. This is not a third-party inference API. The model weights have their own license; review that license before commercial use.

## 3. Configure Opexnal API

Set these environment variables on the server running the Opexnal API (never put secrets in frontend variables):

```env
OPEX_AI_PROVIDER=self_hosted
OPEX_AI_MODEL_ENDPOINT=http://127.0.0.1:11434/v1
OPEX_AI_MODEL_NAME=llama3.2:1b
```

The API and Ollama must be on the same host for the address above to work. If the API runs in another container, use a private Docker network and the service hostname (for example, `http://ollama:11434/v1`). If the API is deployed on Vercel and Ollama is on your phone or laptop, Vercel cannot access that machine's localhost. Move the API and model onto a controlled server or set up a properly authenticated private network; do not expose the model port publicly.

## 4. Verify the model server

```sh
curl -fsS http://127.0.0.1:11434/api/tags
curl -fsS http://127.0.0.1:11434/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"llama3.2:1b","messages":[{"role":"user","content":"Reply with Opexnal AI ready"}],"stream":false}'
```

A successful response from the second command should contain a real model-generated message in `choices[0].message.content`. Only after this works should the Opexnal API be configured to use the endpoint. Test through the actual Opexnal API as well.

## 5. Important limits

- This setup starts the model server; it does not itself provision a cloud server or GPU.
- Model download and inference costs depend on the hardware/hosting you choose.
- A Vercel frontend alone cannot host a persistent Ollama process.
- Do not mark AI as production-ready until model health, API authentication, rate limiting, privacy, and end-to-end chat tests pass.
- Current adapter uses the OpenAI-compatible `/chat/completions` endpoint. If the installed Ollama version differs, verify the endpoint above before deployment.
