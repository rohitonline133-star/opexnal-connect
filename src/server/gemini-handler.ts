import { GoogleGenAI } from "@google/genai";
import { checkRateLimit } from "../lib/security";
import { inspectPromptSecurity } from "./ai-security";
import { securityPipeline } from "./security-pipeline";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env["GEMINI_API_KEY"] || "";
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const ALLOWED_AI_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PROMPT_LENGTH = 2000;
const MAX_MESSAGES_COUNT = 50;

/**
 * Validates request origin against allowed host to prevent unauthorized cross-origin abuse.
 */
function isAllowedOrigin(request: Request): { allowed: boolean; originHeader: string } {
  const origin = request.headers.get("origin") || "";
  if (!origin) {
    // Direct same-origin browser fetches often omit Origin
    return { allowed: true, originHeader: "" };
  }

  try {
    const reqUrl = new URL(request.url);
    const originUrl = new URL(origin);

    // Allow same hostname/domain and standard local dev
    if (
      originUrl.hostname === reqUrl.hostname ||
      originUrl.hostname === "localhost" ||
      originUrl.hostname === "127.0.0.1" ||
      originUrl.hostname.endsWith(".run.app")
    ) {
      return { allowed: true, originHeader: origin };
    }
  } catch {
    return { allowed: false, originHeader: "" };
  }

  return { allowed: false, originHeader: "" };
}

export async function handleAiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { allowed, originHeader } = isAllowedOrigin(request);

  if (!allowed) {
    return new Response(JSON.stringify({ error: "Forbidden: Cross-origin request rejected." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (originHeader) {
    corsHeaders["Access-Control-Allow-Origin"] = originHeader;
    corsHeaders["Vary"] = "Origin";
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method === "GET" && url.pathname === "/api/ai/health") {
    return new Response(JSON.stringify({ status: "ok", service: "opexnal-ai-proxy" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- PER-IP RATE LIMITING ---
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "127.0.0.1";

  const rateCheck = checkRateLimit(`ai_ip:${clientIp}`, 20, 60_000);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. Too many AI requests. Please wait ${rateCheck.retryAfterSec} seconds.`,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfterSec),
        },
      },
    );
  }

  // --- PAYLOAD SIZE & PARSING ---
  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (contentLength > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "Payload too large. Limit is 10MB." }), {
      status: 413,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    return handleFallbackResponse(url.pathname, rawBody, corsHeaders);
  }

  const ai = getAiClient();

  try {
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

      // AI Safety & Prompt Injection Guardrail
      const textToInspect =
        body.prompt ||
        (body.messages && body.messages.length > 0
          ? body.messages[body.messages.length - 1]?.content
          : "");
      if (textToInspect) {
        const promptCheck = inspectPromptSecurity(textToInspect);
        if (!promptCheck.safe) {
          securityPipeline.recordEvent({
            eventType: "PROMPT_INJECTION_BLOCK",
            severity: "WARN",
            actor: { ip: clientIp, userAgent: request.headers.get("user-agent") || "" },
            details: `Prompt injection attack blocked: ${promptCheck.violation}`,
            riskScore: promptCheck.riskScore,
          });
          return new Response(
            JSON.stringify({
              error: "Security Guardrail: Prompt manipulation or jailbreak attempt blocked.",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }

      const contents: Array<{ role?: string; parts: Array<Record<string, unknown>> }> = [];

      if (body.messages && Array.isArray(body.messages)) {
        const sliced = body.messages.slice(-MAX_MESSAGES_COUNT);
        for (const msg of sliced) {
          const cleanText = String(msg.content || "").slice(0, MAX_PROMPT_LENGTH);
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: cleanText }],
          });
        }
      }

      if (body.imageBase64 && body.imageMime) {
        if (!ALLOWED_AI_IMAGE_MIMES.has(body.imageMime.toLowerCase())) {
          return new Response(
            JSON.stringify({ error: "Unsupported image format for AI analysis." }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const lastUser = contents[contents.length - 1];
        if (lastUser && lastUser.role === "user") {
          lastUser.parts.unshift({
            inlineData: {
              data: body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
              mimeType: body.imageMime,
            },
          });
        } else {
          contents.push({
            role: "user",
            parts: [
              {
                inlineData: {
                  data: body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
                  mimeType: body.imageMime,
                },
              },
              {
                text: (
                  body.prompt || "Analyze this image and suggest social media captions."
                ).slice(0, MAX_PROMPT_LENGTH),
              },
            ],
          });
        }
      } else if (body.prompt && contents.length === 0) {
        contents.push({
          role: "user",
          parts: [{ text: String(body.prompt).slice(0, MAX_PROMPT_LENGTH) }],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contents as never,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "I couldn't generate a response. Please try again.";

      return new Response(JSON.stringify({ text: replyText }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      const tone = (body.tone || "Engaging & Viral").slice(0, 50);
      const lang = (body.language || "English / Hinglish").slice(0, 50);
      const cleanTopic = (body.topic || "Daily creator journey").slice(0, MAX_PROMPT_LENGTH);

      switch (body.tool) {
        case "caption":
          prompt = `Generate 3 distinct, high-impact social media captions for Opexnal about: "${cleanTopic}".
Tone: ${tone}. Preferred language style: ${lang}.
For each caption:
- Include a strong opening hook line
- Body text with personality and appropriate spacing
- 4-6 relevant hashtags tailored for Opexnal`;
          break;

        case "reels_idea":
          prompt = `Create a high-performing Reel / Short video concept for Opexnal about: "${cleanTopic}".
Tone: ${tone}.
Include:
1. Hook (0-3 seconds): Exact visual action + on-screen text
2. Narrative beat (3-15 seconds): Core value or punchline
3. Audio recommendation: Style or mood
4. Call-to-action (CTA)`;
          break;

        case "hashtags":
          prompt = `Generate 20 curated, high-reach hashtags for Opexnal creators on the topic: "${cleanTopic}".
Categorize them into:
- 5 Mega High-Volume tags
- 10 Niche Creator tags
- 5 Community & Trending tags`;
          break;

        case "bio":
          prompt = `Write 3 creative bio variations for an Opexnal profile around: "${cleanTopic}".
Style: ${tone}. Keep under 150 characters per option, with tasteful emojis.`;
          break;

        case "rewrite":
          prompt = `Rewrite and enhance the following social post text for higher engagement and clarity:
"${(body.contextText || cleanTopic).slice(0, MAX_PROMPT_LENGTH)}"
Tone: ${tone}. Provide 2 alternative angles.`;
          break;

        case "image_analysis":
          prompt = `Analyze the provided image and generate:
1. Aesthetic mood & aesthetic summary
2. Best visual elements to highlight
3. 3 suggested ready-to-post captions with hashtags (varying from minimalist to descriptive)
4. Recommended music vibe`;
          break;

        default:
          prompt = `Provide social media creator guidance for: ${cleanTopic}`;
      }

      const parts: Array<Record<string, unknown>> = [];
      if (body.imageBase64 && body.imageMime) {
        if (!ALLOWED_AI_IMAGE_MIMES.has(body.imageMime.toLowerCase())) {
          return new Response(
            JSON.stringify({ error: "Unsupported image format for AI analysis." }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        parts.push({
          inlineData: {
            data: body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
            mimeType: body.imageMime,
          },
        });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts }] as never,
        config: {
          systemInstruction:
            "You are Opexnal AI Studio, a creative generator designed for creators on Opexnal. Output crisp, nicely formatted markdown with clear headers, emojis, and ready-to-copy text.",
          temperature: 0.75,
        },
      });

      return new Response(JSON.stringify({ result: response.text || "" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gemini API error, falling back to offline creator response:", err.message);
    return handleFallbackResponse(url.pathname, rawBody, corsHeaders);
  }
}

function handleFallbackResponse(
  pathname: string,
  body: Record<string, unknown>,
  corsHeaders: Record<string, string> = {},
): Response {
  if (pathname === "/api/ai/chat") {
    const prompt = String(body["prompt"] || "");
    let reply =
      "Opexnal AI here! Ask me to generate viral captions, reel scripts, hashtag strategies, or optimize your creator bio.";
    const lower = prompt.toLowerCase();

    if (lower.includes("caption")) {
      reply = `Here are 3 engaging caption options for Opexnal:\n\n1. ✨ **The aesthetic vibe**: Built from relentless focus. What you see today was built in silence yesterday. 🚀\n#Opexnal #CreatorLife #BuildInPublic\n\n2. 🔥 **Short & punchy**: Less noise, more craft.\n\n3. 💬 **Community hook**: Drop your favorite milestone this week below! 👇`;
    } else if (lower.includes("reel") || lower.includes("video") || lower.includes("hook")) {
      reply = `🎬 **Viral Reel Concept**:\n- **Hook (0-3s)**: "Stop scrolling if you're making this one common mistake..."\n- **Visual**: Quick fast-paced cuts showing your workspace and direct screen capture.\n- **Audio**: Ambient energetic lo-fi synth.\n- **Call-to-Action**: "Save this for your next project!"`;
    } else if (lower.includes("hashtag") || lower.includes("tag")) {
      reply = `🔥 **Trending Opexnal Tags**:\n#OpexnalCreators #DigitalAesthetics #VisualStorytelling #NextGenSocial #CreativeStudio #GrowthMindset`;
    } else if (lower.includes("bio")) {
      reply = `✨ **Creator Bio Option**:\n🚀 Building next-gen digital experiences\n🎨 Aesthetics • Tech • Culture\n👇 Connect with my latest journey`;
    }

    return new Response(JSON.stringify({ text: reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      result: `✨ **Opexnal AI Generated Output**:\n\n1. Elevating creative expression every single day. 🚀\n2. Pure focus, authentic stories, real connection.\n3. #Opexnal #CreatorEconomy #DesignInspiration`,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
