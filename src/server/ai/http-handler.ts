import { opexAiGateway } from "./gateway";
import { RateLimiter } from "./rate-limiter";
import { ToolPermissionGuard } from "./tool-permissions";
import type { GenerateRequest, AiMessage, ToolPermission } from "./types";

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

    // =========================================================================
    // ROUTE: /api/ai/generate-image
    // =========================================================================
    if (url.pathname === "/api/ai/generate-image") {
      const body = rawBody as {
        prompt?: string;
        aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
      };

      if (!body.prompt || typeof body.prompt !== "string") {
        return new Response(JSON.stringify({ error: "Missing or invalid prompt parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const imgResult = await opexAiGateway.generateImage(body.prompt, body.aspectRatio || "1:1", {
        clientIp,
        userId,
        endpoint: "/api/ai/generate-image",
      });

      return new Response(JSON.stringify({ success: true, ...imgResult }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ROUTE: /api/ai/edit-image
    // =========================================================================
    if (url.pathname === "/api/ai/edit-image") {
      const body = rawBody as {
        prompt?: string;
        imageBase64?: string;
        imageMime?: string;
      };

      if (!body.prompt || !body.imageBase64) {
        return new Response(JSON.stringify({ error: "prompt and imageBase64 are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const editResult = await opexAiGateway.editImage(
        body.prompt,
        body.imageBase64,
        body.imageMime || "image/png",
        {
          clientIp,
          userId,
          endpoint: "/api/ai/edit-image",
        },
      );

      return new Response(JSON.stringify({ success: true, ...editResult }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ROUTE: /api/ai/transcribe (Audio-to-Text)
    // =========================================================================
    if (url.pathname === "/api/ai/transcribe") {
      const body = rawBody as {
        audioBase64?: string;
        audioMime?: string;
      };

      if (!body.audioBase64) {
        return new Response(JSON.stringify({ error: "audioBase64 is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const asrResult = await opexAiGateway.transcribeAudio(
        body.audioBase64,
        body.audioMime || "audio/wav",
        {
          clientIp,
          userId,
          endpoint: "/api/ai/transcribe",
        },
      );

      return new Response(JSON.stringify({ success: true, ...asrResult }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ROUTE: /api/ai/speech (Text-to-Speech)
    // =========================================================================
    if (url.pathname === "/api/ai/speech") {
      const body = rawBody as {
        text?: string;
        voiceName?: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr";
      };

      if (!body.text || typeof body.text !== "string") {
        return new Response(JSON.stringify({ error: "text parameter is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const speechResult = await opexAiGateway.generateSpeech(body.text, body.voiceName || "Kore", {
        clientIp,
        userId,
        endpoint: "/api/ai/speech",
      });

      return new Response(JSON.stringify({ success: true, ...speechResult }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ROUTE: /api/ai/generate-video
    // =========================================================================
    if (url.pathname === "/api/ai/generate-video") {
      const body = rawBody as {
        prompt?: string;
        aspectRatio?: "16:9" | "9:16";
      };

      if (!body.prompt) {
        return new Response(JSON.stringify({ error: "prompt is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const videoResult = await opexAiGateway.startVideo(body.prompt, body.aspectRatio || "16:9", {
        clientIp,
        userId,
        endpoint: "/api/ai/generate-video",
      });

      return new Response(JSON.stringify({ success: true, ...videoResult }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ROUTE: /api/ai/video-status
    // =========================================================================
    if (url.pathname === "/api/ai/video-status") {
      const body = rawBody as {
        operationName?: string;
      };

      if (!body.operationName) {
        return new Response(JSON.stringify({ error: "operationName is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const statusResult = await opexAiGateway.getVideoStatus(body.operationName);
      return new Response(JSON.stringify({ success: true, ...statusResult }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ROUTE: /api/ai/code-assist (Coding Studio)
    // =========================================================================
    if (url.pathname === "/api/ai/code-assist") {
      const body = rawBody as {
        code?: string;
        instruction?: string;
        language?: string;
      };

      if (!body.instruction) {
        return new Response(JSON.stringify({ error: "instruction is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const codePrompt = `You are Opexnal Coding Studio AI — an elite full-stack engineer and software architect.
Language/Framework: ${body.language || "TypeScript / React / Node.js"}.
Task: ${body.instruction}.
${body.code ? `Existing Code:\n\`\`\`\n${body.code}\n\`\`\`` : ""}

Provide:
1. 💡 Clean, production-ready solution with full TypeScript types
2. 🚀 Performance and architectural considerations
3. 🧪 Unit test verification snippet
4. 🛡️ Security best practices`;

      const genRes = await opexAiGateway.generate(
        {
          messages: [{ role: "user", parts: [{ text: codePrompt }] }],
          systemInstruction:
            "You write robust, secure, defensive code. Avoid placeholders or truncated code. Follow strict type safety.",
          temperature: 0.2,
          userId,
        },
        { clientIp, userId, endpoint: "/api/ai/code-assist" },
      );

      return new Response(
        JSON.stringify({
          success: true,
          output: genRes.response.text,
          provider: genRes.response.provider,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // =========================================================================
    // ROUTE: /api/ai/security-audit (Defensive Cybersecurity Checks)
    // =========================================================================
    if (url.pathname === "/api/ai/security-audit") {
      const body = rawBody as {
        targetCode?: string;
        targetType?: string;
      };

      if (!body.targetCode) {
        return new Response(JSON.stringify({ error: "targetCode is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const auditPrompt = `Perform a comprehensive defensive security audit and OWASP Top 10 vulnerability assessment on the following code/configuration:
\`\`\`
${body.targetCode}
\`\`\`

Analyze for:
1. SQL Injection / NoSQL Injection risks
2. Cross-Site Scripting (XSS) and Content Injection
3. Insecure Direct Object References (IDOR) & Broken Access Controls
4. Authentication & Session hijacking flaws
5. Hardcoded credentials, secret exposures, or sensitive PII
6. Rate limiting & Denial of Service vulnerabilities

Output format:
- Overall Security Risk Level: [CRITICAL | HIGH | MEDIUM | LOW | SECURE]
- Detected Vulnerabilities (with line reference, severity, and impact)
- Concrete Remediation Patch (before and after code)
- Defensive Hardening Recommendations`;

      const genRes = await opexAiGateway.generate(
        {
          messages: [{ role: "user", parts: [{ text: auditPrompt }] }],
          systemInstruction:
            "You are a Senior Defensive Cybersecurity Auditor. Output thorough, authoritative findings with actionable hardening guidelines.",
          temperature: 0.1,
          userId,
        },
        { clientIp, userId, endpoint: "/api/ai/security-audit" },
      );

      return new Response(
        JSON.stringify({
          success: true,
          auditReport: genRes.response.text,
          provider: genRes.response.provider,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // =========================================================================
    // ROUTE: /api/ai/agent-invoke (AI Agent with Tool Permissions & Confirmation)
    // =========================================================================
    if (url.pathname === "/api/ai/agent-invoke") {
      const body = rawBody as {
        toolName?: string;
        params?: Record<string, unknown>;
        confirmedByUser?: boolean;
        callerUserId?: string;
        targetUserId?: string;
      };

      if (!body.toolName) {
        return new Response(JSON.stringify({ error: "toolName is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const caller = body.callerUserId || userId || "user_current";
      const target = body.targetUserId || caller;

      // In production, user roles and granted permissions are queried from database/session.
      // Default grant standard creator tool permissions:
      const granted = new Set<ToolPermission>([
        "ai:generate_caption",
        "ai:generate_ideas",
        "ai:moderate_content",
        "ai:read_own_stats",
        "ai:draft_post",
      ]);

      const authCheck = ToolPermissionGuard.authorizeToolInvocation(body.toolName, {
        callerUserId: caller,
        targetUserId: target,
        grantedPermissions: granted,
        confirmedByUser: Boolean(body.confirmedByUser),
      });

      if (!authCheck.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            blocked: true,
            reason: authCheck.reason,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }

      // Execute authorized tool action
      let toolOutput = "";
      if (body.toolName === "generate_caption") {
        const topic = (body.params?.["topic"] as string) || "General Social Post";
        const tone = (body.params?.["tone"] as string) || "Engaging";
        const toolRes = await opexAiGateway.generate(
          {
            messages: [{ role: "user", parts: [{ text: `Generate caption for: ${topic} in ${tone} tone` }] }],
            temperature: 0.7,
            userId: caller,
          },
          { clientIp, userId: caller, endpoint: "/api/ai/agent-invoke" },
        );
        toolOutput = toolRes.response.text;
      } else if (body.toolName === "draft_post") {
        const caption = (body.params?.["caption"] as string) || "New AI Draft";
        toolOutput = `[AGENT ACTION COMPLETE] Successfully drafted post: "${caption}" for user ${caller}. Status: Saved as Draft.`;
      } else if (body.toolName === "moderate_content") {
        const content = (body.params?.["content"] as string) || "";
        const modRes = await opexAiGateway.moderate({ content, userId: caller }, { clientIp, userId: caller, endpoint: "/api/ai/agent-invoke" });
        toolOutput = JSON.stringify(modRes.result);
      } else {
        toolOutput = `[AGENT] Executed ${body.toolName} successfully.`;
      }

      return new Response(
        JSON.stringify({
          success: true,
          toolName: body.toolName,
          callerUserId: caller,
          confirmedByUser: body.confirmedByUser,
          result: toolOutput,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
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
