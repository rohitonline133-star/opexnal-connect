import { opexAiGateway } from "./gateway";
import { RateLimiter } from "./rate-limiter";
import type { GenerateRequest, AiMessage } from "./types";

type NodeIncomingRequest = {
  complete?: boolean;
  rawBody?: string | Buffer;
  on: (event: "data" | "end", listener: (...args: unknown[]) => void) => void;
  once: (event: "end" | "error", listener: (...args: unknown[]) => void) => void;
};

async function parseRequestBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const nodeReq = (request as Request & { runtime?: { node?: { req?: NodeIncomingRequest } } })
      .runtime?.node?.req;
    if (nodeReq) {
      if (nodeReq.complete && nodeReq.rawBody) {
        const str =
          typeof nodeReq.rawBody === "string" ? nodeReq.rawBody : nodeReq.rawBody.toString("utf8");
        return str ? JSON.parse(str) : {};
      }
      const chunks: Buffer[] = [];
      const text = await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => resolve(""), 5000);
        nodeReq.on("data", (chunk: unknown) => {
          if (Buffer.isBuffer(chunk)) {
            chunks.push(chunk);
          } else if (typeof chunk === "string") {
            chunks.push(Buffer.from(chunk, "utf8"));
          } else if (chunk instanceof Uint8Array) {
            chunks.push(Buffer.from(chunk));
          }
        });
        nodeReq.once("end", () => {
          clearTimeout(timer);
          resolve(Buffer.concat(chunks).toString("utf8"));
        });
        nodeReq.once("error", (err: unknown) => {
          clearTimeout(timer);
          reject(err);
        });
      });
      return text ? JSON.parse(text) : {};
    }

    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.error("[parseRequestBody] Failed to parse request body:", err);
    return {};
  }
}

function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  }
  return request.headers.get("cf-connecting-ip") || "127.0.0.1";
}

function extractUserId(request: Request): string | undefined {
  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    if (token.startsWith("opexnal_jwt_") || token.startsWith("opexnal_demo_")) {
      const parts = token.split("_");
      return parts.slice(2).join("_") || undefined;
    }
  }
  return undefined;
}

/**
 * OPEX AI Universal HTTP Handler
 *
 * Routes incoming API requests through the provider-independent gateway.
 * Preserves 100% backward compatibility for all existing UI endpoints.
 */
export async function handleAiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // 1. CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Opex-Correlation-Id",
      },
    });
  }

  // 2. Health & Diagnostic Endpoints (GET)
  if (request.method === "GET") {
    if (url.pathname === "/api/ai/health") {
      const health = await opexAiGateway.getHealth();
      return new Response(JSON.stringify(health), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/api/ai/capabilities") {
      const capabilities = opexAiGateway.getCapabilities();
      return new Response(JSON.stringify(capabilities), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Payload size check
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > RateLimiter.MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({
        error: "Payload too large. Maximum allowed size is 5MB.",
      }),
      { status: 413, headers: { "Content-Type": "application/json" } },
    );
  }

  const clientIp = extractClientIp(request);
  const userId = extractUserId(request);
  const rawBody = await parseRequestBody(request);

  try {
    // =========================================================================
    // ROUTE: /api/ai/chat (Conversational Co-pilot)
    // =========================================================================
    if (url.pathname === "/api/ai/chat") {
      const body = rawBody as {
        messages?: Array<{ role: "user" | "model"; content: string }>;
        prompt?: string;
        language?: string;
        imageBase64?: string;
        imageMime?: string;
      };

      const systemInstruction = `You are Opexnal AI, the official intelligent creative co-pilot and social strategist for the Opexnal social platform.
You are energetic, helpful, culturally savvy, and expert in social media growth, creator tools, viral content ideas, reels scripting, hashtags, and digital aesthetics.
You effortlessly understand and communicate in English, Hindi (हिन्दी), and Hinglish (natural blend of Hindi & English written in Roman script).
Respond warmly, with structured formatting (bullet points, clear sections, tasteful emojis).
Keep your answers actionable, authentic, and tailored for modern creators and community members.`;

      const domainMessages: AiMessage[] = [];

      if (body.messages && Array.isArray(body.messages)) {
        for (const msg of body.messages) {
          domainMessages.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          });
        }
      }

      if (body.imageBase64 && body.imageMime) {
        const lastUser = domainMessages[domainMessages.length - 1];
        const imagePart = {
          inlineData: {
            data: body.imageBase64,
            mimeType: body.imageMime,
          },
        };
        if (lastUser && lastUser.role === "user") {
          lastUser.parts.unshift(imagePart);
        } else {
          domainMessages.push({
            role: "user",
            parts: [
              imagePart,
              { text: body.prompt || "Analyze this image and suggest social media captions." },
            ],
          });
        }
      } else if (body.prompt && domainMessages.length === 0) {
        domainMessages.push({
          role: "user",
          parts: [{ text: body.prompt }],
        });
      }

      const generateReq: GenerateRequest = {
        messages: domainMessages,
        systemInstruction,
        temperature: 0.7,
        userId,
      };

      const { response, correlationId } = await opexAiGateway.generate(generateReq, {
        clientIp,
        userId,
        endpoint: "/api/ai/chat",
      });

      return new Response(JSON.stringify({ text: response.text }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Opex-Correlation-Id": correlationId,
        },
      });
    }

    // =========================================================================
    // ROUTE: /api/ai/creator-tools (Captions, Reels, Tags, Bios, Rewrites)
    // =========================================================================
    if (url.pathname === "/api/ai/creator-tools") {
      const body = rawBody as {
        tool: "caption" | "reels_idea" | "hashtags" | "bio" | "rewrite" | "image_analysis";
        topic?: string;
        tone?: string;
        language?: string;
        imageBase64?: string;
        imageMime?: string;
        contextText?: string;
      };

      let prompt = "";
      const tone = body.tone || "Engaging & Viral";
      const lang = body.language || "English / Hinglish";

      switch (body.tool) {
        case "caption":
          prompt = `Generate 3 distinct, high-impact social media captions for Opexnal about: "${body.topic || "Daily creator journey"}".
Tone: ${tone}. Preferred language style: ${lang}.
For each caption:
- Include a strong opening hook line
- Body text with personality and appropriate spacing
- Relevant call-to-action
- 5-8 curated high-reach and niche hashtags`;
          break;

        case "reels_idea":
          prompt = `Generate 3 viral short-video / reel concepts for Opexnal around the topic: "${body.topic || "Creator Lifestyle & Tech"}".
Tone: ${tone}. Language: ${lang}.
For each reel concept provide:
1. 🎯 3-Second Hook (What appears on screen / first spoken sentence)
2. 🎬 Visual scene flow & action
3. 🎵 Suggested audio / music mood vibe
4. 💬 Caption & 4 essential hashtags`;
          break;

        case "hashtags":
          prompt = `Generate a categorized hashtag set for Opexnal for the topic: "${body.topic || "Photography & Lifestyle"}".
Group them clearly into:
- 🚀 High-Volume Trending (Top 5)
- 🎯 Niche Community Tags (Top 8)
- ✨ Aesthetic & Location/Vibe Tags (Top 5)
Also provide a one-click copyable combined list.`;
          break;

        case "bio":
          prompt = `Create 4 modern, eye-catching profile bio options for an Opexnal user who is into: "${body.topic || "Digital Creator & Tech Explorer"}".
Tone: ${tone}. Language: ${lang}.
Include clean line breaks, tasteful emojis, and a clear call-to-action link placeholder.`;
          break;

        case "rewrite":
          prompt = `Rewrite and elevate this text for maximum social engagement on Opexnal:
"${body.contextText || body.topic || "Sharing my thoughts today"}"
Desired style/tone: ${tone}. Language: ${lang}.
Provide 3 variations (Short & punchy, Storytelling, and Witty/Hinglish).`;
          break;

        case "image_analysis":
          prompt = `Analyze this image in detail for a creator on Opexnal:
1. Aesthetic & mood breakdown
2. Best visual elements to highlight
3. 3 suggested ready-to-post captions with hashtags
4. Recommended music vibe`;
          break;

        default:
          prompt = `Provide social media creator guidance for: ${body.topic || "Content strategy"}`;
      }

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      if (body.imageBase64 && body.imageMime) {
        parts.push({
          inlineData: {
            data: body.imageBase64,
            mimeType: body.imageMime,
          },
        });
      }
      parts.push({ text: prompt });

      const generateReq: GenerateRequest = {
        messages: [{ role: "user", parts }],
        systemInstruction:
          "You are Opexnal AI Studio, a creative generator designed for creators on Opexnal. Output crisp, nicely formatted markdown with clear headers, emojis, and ready-to-copy text.",
        temperature: 0.75,
        userId,
      };

      const { response, correlationId } = await opexAiGateway.generate(generateReq, {
        clientIp,
        userId,
        endpoint: "/api/ai/creator-tools",
      });

      return new Response(JSON.stringify({ result: response.text }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Opex-Correlation-Id": correlationId,
        },
      });
    }

    // =========================================================================
    // ROUTE: /api/ai/moderate (Safety & Policy Classification)
    // =========================================================================
    if (url.pathname === "/api/ai/moderate") {
      const body = rawBody as {
        content: string;
        contentType?: "text" | "caption" | "comment" | "bio";
      };

      if (!body.content) {
        return new Response(JSON.stringify({ error: "Missing content field" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const modResponse = await opexAiGateway.moderate(
        {
          content: body.content,
          contentType: body.contentType || "comment",
          userId,
        },
        {
          clientIp,
          userId,
          endpoint: "/api/ai/moderate",
        },
      );

      return new Response(JSON.stringify(modResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal AI Gateway error";
    const status = message.includes("Too many requests")
      ? 429
      : message.includes("rejected by Opexnal Safety")
        ? 400
        : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
