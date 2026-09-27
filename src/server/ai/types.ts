/**
 * OPEX AI Types & Interfaces
 *
 * Provider-agnostic domain contracts for the Opexnal AI Platform.
 * Compatible with exactOptionalPropertyTypes: true.
 */

export type AiRole = "user" | "model" | "system";

export interface AiMessagePart {
  text?: string | undefined;
  inlineData?:
    | {
        mimeType: string;
        data: string; // base64
      }
    | undefined;
}

export interface AiMessage {
  role: AiRole;
  parts: AiMessagePart[];
}

export interface GenerateRequest {
  messages: AiMessage[];
  systemInstruction?: string | undefined;
  temperature?: number | undefined;
  maxTokens?: number | undefined;
  correlationId?: string | undefined;
  userId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface GenerateResponse {
  text: string;
  provider: string;
  model: string;
  usage?:
    | {
        promptTokens?: number | undefined;
        completionTokens?: number | undefined;
        totalTokens?: number | undefined;
      }
    | undefined;
  finishReason?: string | undefined;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface EmbeddingRequest {
  text: string | string[];
  userId?: string | undefined;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  dimensions: number;
  provider: string;
}

export interface ModerationRequest {
  content: string;
  contentType?: "text" | "caption" | "comment" | "bio" | undefined;
  userId?: string | undefined;
}

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hateSpeech: boolean;
    harassment: boolean;
    scamOrFraud: boolean;
    sexualContent: boolean;
    selfHarm: boolean;
    spam: boolean;
  };
  score: number; // 0.0 to 1.0
  reason?: string | undefined;
}

export interface ModerationResponse {
  result: ModerationResult;
  provider: string;
}

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  provider: string;
  latencyMs: number;
  error?: string | undefined;
  timestamp: string;
}

export interface ProviderCapabilities {
  supportsChat: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsEmbeddings: boolean;
  supportsModeration: boolean;
  supportsFunctionCalling: boolean;
  maxContextTokens: number;
  name: string;
  version: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  correlationId: string;
  userId?: string | undefined;
  ipAddress?: string | undefined;
  endpoint: string;
  provider: string;
  model: string;
  action: string;
  status: "success" | "error" | "rate_limited" | "blocked_safety";
  latencyMs: number;
  promptLength: number;
  responseLength?: number | undefined;
  safetyFlagged?: boolean | undefined;
  errorMessage?: string | undefined;
}

export type ToolPermission =
  | "ai:read_own_stats"
  | "ai:generate_caption"
  | "ai:generate_ideas"
  | "ai:moderate_content"
  | "ai:draft_post";

export interface ToolDefinition {
  name: string;
  description: string;
  requiredPermission: ToolPermission;
  parameters: Record<string, unknown>;
  requiresUserConfirmation?: boolean | undefined;
}
