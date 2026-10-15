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

export async function generateAiImage(
  prompt: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1",
): Promise<{ imageUrl: string; mimeType: string; provider: string }> {
  const response = await fetch("/api/ai/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Image generation failed");
  }
  return (await response.json()) as { imageUrl: string; mimeType: string; provider: string };
}

export async function editAiImage(
  prompt: string,
  imageBase64: string,
  imageMime = "image/png",
): Promise<{ imageUrl: string; mimeType: string; provider: string }> {
  const response = await fetch("/api/ai/edit-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, imageBase64, imageMime }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Image editing failed");
  }
  return (await response.json()) as { imageUrl: string; mimeType: string; provider: string };
}

export async function transcribeAudio(
  audioBase64: string,
  audioMime = "audio/wav",
): Promise<{ text: string; provider: string }> {
  const response = await fetch("/api/ai/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, audioMime }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Audio transcription failed");
  }
  return (await response.json()) as { text: string; provider: string };
}

export async function generateSpeechAudio(
  text: string,
  voiceName: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr" = "Kore",
): Promise<{ audioBase64: string; mimeType: string; provider: string }> {
  const response = await fetch("/api/ai/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceName }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Speech generation failed");
  }
  return (await response.json()) as { audioBase64: string; mimeType: string; provider: string };
}

export async function startAiVideoGeneration(
  prompt: string,
  aspectRatio: "16:9" | "9:16" = "16:9",
): Promise<{ operationName: string; provider: string }> {
  const response = await fetch("/api/ai/generate-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Video generation initiation failed");
  }
  return (await response.json()) as { operationName: string; provider: string };
}

export async function checkAiVideoStatus(
  operationName: string,
): Promise<{ done: boolean; videoUri?: string }> {
  const response = await fetch("/api/ai/video-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operationName }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to check video generation status");
  }
  return (await response.json()) as { done: boolean; videoUri?: string };
}

export async function runAiCodeAssist(
  instruction: string,
  code?: string,
  language = "TypeScript",
): Promise<{ output: string; provider: string }> {
  const response = await fetch("/api/ai/code-assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruction, code, language }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Code generation failed");
  }
  const data = (await response.json()) as { output: string; provider: string };
  return data;
}

export async function runAiSecurityAudit(
  targetCode: string,
  targetType = "application/typescript",
): Promise<{ auditReport: string; provider: string }> {
  const response = await fetch("/api/ai/security-audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetCode, targetType }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Security audit failed");
  }
  const data = (await response.json()) as { auditReport: string; provider: string };
  return data;
}

export async function invokeAiAgent(params: {
  toolName: string;
  params: Record<string, unknown>;
  confirmedByUser?: boolean;
  callerUserId?: string;
  targetUserId?: string;
}): Promise<{
  success: boolean;
  toolName: string;
  result?: string;
  blocked?: boolean;
  reason?: string;
}> {
  const response = await fetch("/api/ai/agent-invoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as {
    success: boolean;
    toolName: string;
    result?: string;
    blocked?: boolean;
    reason?: string;
  };
  return data;
}
