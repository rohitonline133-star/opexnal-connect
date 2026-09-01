export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  imagePreview?: string;
}

export interface AiCreatorOptions {
  tool: "caption" | "reels_idea" | "hashtags" | "bio" | "rewrite" | "image_analysis";
  topic?: string;
  tone?: string;
  language?: string;
  imageBase64?: string;
  imageMime?: string;
  contextText?: string;
}

export async function sendAiChatMessage(params: {
  messages: Array<{ role: "user" | "model"; content: string }>;
  prompt?: string;
  language?: string;
  imageBase64?: string;
  imageMime?: string;
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
