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

export async function sendAiChatMessage(params: {
  messages: Array<{ role: "user" | "model"; content: string }>;
  prompt?: string | undefined;
  language?: string | undefined;
  imageBase64?: string | undefined;
  imageMime?: string | undefined;
}): Promise<string> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to communicate with Opexnal AI");
  }

  const data = (await response.json()) as { text: string };
  return data.text;
}

export async function runAiCreatorTool(options: AiCreatorOptions): Promise<string> {
  const response = await fetch("/api/ai/creator-tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to run AI tool");
  }

  const data = (await response.json()) as { result: string };
  return data.result;
}
