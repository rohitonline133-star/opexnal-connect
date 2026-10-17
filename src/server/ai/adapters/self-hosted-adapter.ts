import type { AIProvider } from "../provider-interface";
import type {
  GenerateRequest,
  GenerateResponse,
  StreamChunk,
  EmbeddingRequest,
  EmbeddingResponse,
  ModerationRequest,
  ModerationResponse,
  HealthCheckResult,
  ProviderCapabilities,
} from "../types";

/**
 * Self-Hosted Model Runtime Adapter
 *
 * Implements the AIProvider interface for Opexnal-controlled inference runtimes.
 * Supports OpenAI-compatible REST inference servers (e.g., vLLM, Ollama, TGI, LocalAI)
 * hosted within Opexnal private infrastructure or local clusters.
 */
export class SelfHostedProviderAdapter implements AIProvider {
  public readonly id = "self_hosted";
  public readonly name = "Opexnal Self-Hosted Cluster Runtime";

  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly embeddingEndpoint: string;

  constructor(endpoint?: string, apiKey?: string, model?: string) {
    this.endpoint = endpoint ?? (process.env["OPEX_AI_MODEL_ENDPOINT"] || "");
    this.apiKey = apiKey ?? (process.env["OPEX_AI_API_KEY"] || "");
    this.model = model ?? (process.env["OPEX_AI_MODEL_NAME"] || "opexnal-llama-3-8b");
    this.embeddingEndpoint = process.env["OPEX_AI_EMBEDDING_ENDPOINT"] || this.endpoint;
  }

  public isConfigured(): boolean {
    return Boolean(this.endpoint && this.endpoint.trim().startsWith("http"));
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Opexnal-AI-Gateway/1.0",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.isConfigured()) {
      throw new Error("[SelfHostedAdapter] OPEX_AI_MODEL_ENDPOINT is not configured");
    }

    const messages = [];
    if (request.systemInstruction) {
      messages.push({ role: "system", content: request.systemInstruction });
    }
    for (const msg of request.messages) {
      const textParts = msg.parts.map((p) => p.text || "").join(" ");
      messages.push({ role: msg.role === "model" ? "assistant" : "user", content: textParts });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${this.endpoint.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1024,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(
          `Inference server responded with ${res.status}: ${errorText.slice(0, 100)}`,
        );
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const reply = data.choices?.[0]?.message?.content?.trim() || "";
      if (!reply) {
        throw new Error("OPEX_AI_MODEL_UNAVAILABLE: inference server returned an empty model response.");
      }
      const result: GenerateResponse = {
        text: reply,
        provider: this.id,
        model: this.model,
      };

      if (data.usage) {
        result.usage = {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        };
      }

      return result;
    } finally {
      clearTimeout(timeout);
    }
  }

  async *stream(request: GenerateRequest): AsyncIterable<StreamChunk> {
    const full = await this.generate(request);
    const words = full.text.split(" ");
    for (let i = 0; i < words.length; i++) {
      yield {
        text: words[i] + (i === words.length - 1 ? "" : " "),
        done: i === words.length - 1,
      };
    }
  }

  async embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const texts = Array.isArray(request.text) ? request.text : [request.text];
    if (!this.isConfigured()) {
      throw new Error("OPEX_AI_EMBEDDINGS_UNAVAILABLE: OPEX_AI_MODEL_ENDPOINT is not configured.");
    }

    const embeddingModel = process.env["OPEX_AI_EMBEDDING_MODEL"] || "nomic-embed-text";
    const ollamaEmbedding = this.embeddingEndpoint.includes(":11434");
    const embeddingUrl = ollamaEmbedding
      ? `${this.embeddingEndpoint.replace(/\/$/, "").replace(/\/v1$/, "")}/api/embed`
      : `${this.embeddingEndpoint.replace(/\/$/, "")}/embeddings`;
    const embeddingHeaders = ollamaEmbedding
      ? { "Content-Type": "application/json", "User-Agent": "Opexnal-AI-Gateway/1.0" }
      : this.getHeaders();
    const res = await fetch(embeddingUrl, {
      method: "POST",
      headers: embeddingHeaders,
      body: JSON.stringify(ollamaEmbedding
        ? { model: embeddingModel, input: texts }
        : { model: embeddingModel, input: texts }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`OPEX_AI_EMBEDDINGS_UNAVAILABLE: embedding server returned HTTP ${res.status}.`);
    }

    const data = (await res.json()) as {
      data?: Array<{ embedding: number[] }>;
      embeddings?: number[][];
    };
    const vectors = ollamaEmbedding
      ? data.embeddings
      : data.data?.map((item) => item.embedding);
    if (!vectors || vectors.length !== texts.length || vectors.some((vector) => !Array.isArray(vector) || vector.length === 0)) {
      throw new Error("OPEX_AI_EMBEDDINGS_UNAVAILABLE: embedding server returned an invalid response.");
    }

    const dimensions = vectors[0]?.length ?? 0;
    if (vectors.some((vector) => vector.length !== dimensions)) {
      throw new Error("OPEX_AI_EMBEDDINGS_UNAVAILABLE: embedding dimensions do not match.");
    }

    return { embeddings: vectors, dimensions, provider: this.id };
  }

  async moderate(request: ModerationRequest): Promise<ModerationResponse> {
    const lower = request.content.toLowerCase();
    const hasBadWord =
      lower.includes("spam") ||
      lower.includes("scam") ||
      lower.includes("kill") ||
      lower.includes("hate");

    return {
      result: {
        flagged: hasBadWord,
        categories: {
          hateSpeech: lower.includes("hate"),
          harassment: lower.includes("kill"),
          scamOrFraud: lower.includes("scam"),
          sexualContent: false,
          selfHarm: lower.includes("kill myself"),
          spam: lower.includes("spam"),
        },
        score: hasBadWord ? 0.9 : 0.05,
        reason: hasBadWord ? "Safety rule violation" : "Passed standard checks",
      },
      provider: this.id,
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    if (!this.isConfigured()) {
      return {
        status: "unhealthy",
        provider: this.id,
        latencyMs: 0,
        error: "OPEX_AI_MODEL_ENDPOINT is not configured",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // When a separate embedding endpoint is configured, chat runs on vLLM;
      // otherwise retain the Ollama-compatible /api/tags health probe.
      const separateEmbeddingEndpoint = Boolean(process.env["OPEX_AI_EMBEDDING_ENDPOINT"]);
      const base = this.endpoint.replace(/\/$/, "");
      const healthUrl = separateEmbeddingEndpoint
        ? `${base}/models`
        : `${base.replace(/\/v1$/, "")}/api/tags`;
      const res = await fetch(healthUrl, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });

      const healthRes: HealthCheckResult = {
        status: res.ok ? "healthy" : "degraded",
        provider: this.id,
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
      if (!res.ok) {
        healthRes.error = `HTTP status ${res.status}`;
      }
      return healthRes;
    } catch (err) {
      return {
        status: "unhealthy",
        provider: this.id,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      };
    }
  }

  capabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsStreaming: true,
      supportsVision: false,
      supportsEmbeddings: true,
      supportsModeration: true,
      supportsFunctionCalling: false,
      maxContextTokens: 32768,
      name: this.name,
      version: this.model,
    };
  }
}
