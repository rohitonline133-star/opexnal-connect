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
} from "./types";

/**
 * Universal AI Provider Interface
 *
 * Defines the standard contract all runtime model adapters (Gemini, Self-Hosted,
 * Local Autonomous Runtime) must fulfill. Application logic strictly consumes
 * this interface without direct vendor dependencies.
 */
export interface AIProvider {
  readonly id: string;
  readonly name: string;

  /** Generate standard text or multimodal response */
  generate(request: GenerateRequest): Promise<GenerateResponse>;

  /** Stream response tokens incrementally */
  stream(request: GenerateRequest): AsyncIterable<StreamChunk>;

  /** Generate vector embeddings for text search and recommendation */
  embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /** Run content safety, hate speech, scam and moderation classification */
  moderate(request: ModerationRequest): Promise<ModerationResponse>;

  /** Run live heartbeat and latency check on the provider runtime */
  healthCheck(): Promise<HealthCheckResult>;

  /** Report operational limits and supported modalities */
  capabilities(): ProviderCapabilities;
}
