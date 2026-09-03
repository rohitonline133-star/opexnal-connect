import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function handleAiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful fallback if GEMINI_API_KEY is not configured yet
    return handleFallbackResponse(url.pathname, rawBody);
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

      // Build contents
      const contents: Array<{ role?: string; parts: Array<Record<string, unknown>> }> = [];

      if (body.messages && Array.isArray(body.messages)) {
        for (const msg of body.messages) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          });
        }
      }

      // If there is an image in the latest request
      if (body.imageBase64 && body.imageMime) {
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
              { text: body.prompt || "Analyze this image and suggest social media captions." },
            ],
          });
        }
      } else if (body.prompt && contents.length === 0) {
        contents.push({
          role: "user",
          parts: [{ text: body.prompt }],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contents as never,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "I couldn't generate a response. Please try again.";

      return new Response(JSON.stringify({ text: replyText }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
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
3. 3 suggested ready-to-post captions with hashtags (varying from minimalist to descriptive)
4. Recommended music vibe`;
          break;

        default:
          prompt = `Provide social media creator guidance for: ${body.topic || "Content strategy"}`;
      }

      const parts: Array<Record<string, unknown>> = [];
      if (body.imageBase64 && body.imageMime) {
        parts.push({
          inlineData: {
            data: body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
            mimeType: body.imageMime,
          },
        });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ role: "user", parts }] as never,
        config: {
          systemInstruction:
            "You are Opexnal AI Studio, a creative generator designed for creators on Opexnal. Output crisp, nicely formatted markdown with clear headers, emojis, and ready-to-copy text.",
          temperature: 0.75,
        },
      });

      return new Response(JSON.stringify({ result: response.text || "" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gemini API error, falling back to offline creator response:", err.message);
    return handleFallbackResponse(url.pathname, rawBody);
  }
}

function handleFallbackResponse(pathname: string, body: Record<string, unknown>): Response {
  if (pathname === "/api/ai/chat") {
    const prompt = String(body.prompt || "");
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
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      result: `✨ **Opexnal AI Generated Output**:\n\n1. Elevating creative expression every single day. 🚀\n2. Pure focus, authentic stories, real connection.\n3. #Opexnal #CreatorEconomy #DesignInspiration`,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
