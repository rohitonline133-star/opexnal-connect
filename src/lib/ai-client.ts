export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  imagePreview?: string | undefined;
}

export interface AiCreatorOptions {
  tool: "caption" | "reels_idea" | "hashtags" | "bio" | "rewrite" | "image_analysis";
  topic?: string | undefined;
  tone?: string | undefined;
  language?: string | undefined;
  imageBase64?: string | undefined;
  imageMime?: string | undefined;
  contextText?: string | undefined;
}

export interface AiHealthStatus {
  status: string;
  activeProvider: string;
  allProviders: Array<{
    status: string;
    provider: string;
    latencyMs: number;
    error?: string;
  }>;
  timestamp: string;
}

export interface AiCapabilities {
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

export async function sendAiChatMessage(params: {
  messages: Array<{ role: "user" | "model"; content: string }>;
  prompt?: string | undefined;
  language?: string | undefined;
  imageBase64?: string | undefined;
  imageMime?: string | undefined;
}): Promise<string> {
  const correlationId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Opex-Correlation-Id": correlationId,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to communicate with Opexnal AI");
  }

  const data = (await response.json()) as { text: string };
  return data.text;
}

export async function runAiCreatorTool(options: AiCreatorOptions): Promise<string> {
  const correlationId = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const response = await fetch("/api/ai/creator-tools", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Opex-Correlation-Id": correlationId,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to run AI tool");
  }

  const data = (await response.json()) as { result: string };
  return data.result;
}

export async function checkAiHealth(): Promise<AiHealthStatus> {
  const response = await fetch("/api/ai/health", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Health check returned status ${response.status}`);
  }

  return (await response.json()) as AiHealthStatus;
}

export async function getAiCapabilities(): Promise<AiCapabilities> {
  const response = await fetch("/api/ai/capabilities", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Capabilities check returned status ${response.status}`);
  }

  return (await response.json()) as AiCapabilities;
}

export async function moderateContentWithAi(
  content: string,
  contentType: "text" | "caption" | "comment" | "bio" = "text",
): Promise<{
  flagged: boolean;
  score: number;
  reason?: string | undefined;
  provider: string;
}> {
  const response = await fetch("/api/ai/moderate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, contentType }),
  });

  if (!response.ok) {
    throw new Error(`Moderation request returned status ${response.status}`);
  }

  const data = (await response.json()) as {
    result: { flagged: boolean; score: number; reason?: string };
    provider: string;
  };
  return {
    flagged: data.result.flagged,
    score: data.result.score,
    reason: data.result.reason,
    provider: data.provider,
  };
}
