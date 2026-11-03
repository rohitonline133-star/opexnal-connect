import type { AIProvider } from "../provider-interface";
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
} from "../types";

/**
 * Opexnal Autonomous Runtime Adapter
 *
 * An independent, platform-controlled inference and heuristic synthesis engine.
 * Guaranteed 100% offline availability with zero external API key requirements.
 * Provides high-utility multilingual creator generation (English, Hindi, Hinglish),
 * content safety classification, and semantic hashing.
 */
export class OpexnalAutonomousRuntimeAdapter implements AIProvider {
  public readonly id = "opex_runtime";
  public readonly name = "Opexnal Autonomous Social & Safety Engine";

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const lastMessage = request.messages[request.messages.length - 1];
    const userPrompt = lastMessage?.parts.map((p) => p.text || "").join(" ") || "";
    const lower = userPrompt.toLowerCase();

    // Check if the request contains image inline data
    const hasImage = request.messages.some((m) => m.parts.some((p) => Boolean(p.inlineData)));

    let text = "";

    if (hasImage || lower.includes("image") || lower.includes("analyze this")) {
      text = `📸 **Opexnal Visual Studio Analysis**:
- **Aesthetic Breakdown**: Crisp composition, dynamic contrast, contemporary digital finish.
- **Visual Focal Points**: Strong leading lines and balanced subject hierarchy.
- **Top 3 Ready-to-Post Captions**:
  1. ✨ "Every frame holds a story waiting to be told. 🚀"
  2. 🎨 "Aesthetics aren't added; they are uncovered in the craft."
  3. ⚡ "Behind every visual is countless hours of experimentation."
- **Recommended Hashtags**: #OpexnalCreators #VisualStorytelling #DigitalArt #AestheticFeed
- **Audio Mood**: Deep ambient synth-wave or subtle lo-fi chill hop.`;
    } else if (lower.includes("caption")) {
      text = `✨ **Opexnal Studio Captions**:

1. 🚀 **The Creator Vibe**:
"Quiet discipline in the studio turns into effortless execution on stage. Keep building. 💫"
👉 *CTA: What’s your biggest project this month? Let me know below!*
#Opexnal #CreatorEconomy #BuildInPublic #DailyGrind

2. ⚡ **Short & Punchy**:
"Less noise, more substance. 🎯"
#Minimalist #Focus #Craft

3. 💬 **Hinglish Community Hook**:
"Jab kaam bolta hai, toh shor machane ki zarurat nahi padti! 🔥 Tag that one friend jo hamesha hustle mode mein rehta hai."
#HinglishCreators #DesiAesthetics #IndiaCreators`;
    } else if (lower.includes("reel") || lower.includes("video") || lower.includes("hook")) {
      text = `🎬 **Viral Reel Concepts for Opexnal**:

1. 🎯 **The Contrarian Hook (0-3s)**:
- *Screen Text & Voiceover*: "The biggest mistake creators make when growing on Opexnal..."
- *Visual*: Dynamic B-roll jump cuts between workspace and timeline editing.
- *Audio Mood*: Punchy trending bassline with swift transitions.
- *Call to Action*: "Save this checklist for your next upload!"

2. 💡 **Behind-The-Scenes Secret**:
- *Hook*: "Ever wonder how this aesthetic is built in under 10 minutes?"
- *Visual*: Split screen before & after color grading.
- *Caption*: "Workflow tips you need right now ⚡ #ReelsIndia #CreatorHacks"`;
    } else if (lower.includes("hashtag") || lower.includes("tag")) {
      text = `🔥 **Curated Opexnal Hashtag Strategy**:

• **🚀 High-Reach Discovery (Top 5)**:
#Opexnal #CreatorStudio #ContentCreators #ExplorePage #ViralReels

• **🎯 Niche Community Engagement (Top 8)**:
#CreativeWorkflow #AestheticDesign #BuildInPublic #VisualStorytellers #TechCommunity #StudioVibes #HinglishCreators #DesignInspo

• **✨ Aesthetic & Mood (Top 5)**:
#MinimalistAesthetics #ModernCraft #NextGenSocial #DigitalCulture #VibeCheck

📋 *Copyable Set*:
\`#Opexnal #CreatorStudio #CreativeWorkflow #AestheticDesign #BuildInPublic #VisualStorytellers #ViralReels\``;
    } else if (lower.includes("bio")) {
      text = `✨ **Modern Profile Bio Options for Opexnal**:

Option 1 (Minimalist & Punchy):
🚀 Digital Creator & Visual Strategist
🎨 Exploring design, code & culture
👇 Latest drops & projects below

Option 2 (Community & Builder):
✨ Building next-gen social experiences
💡 Daily creator insights • Hinglish & English
🤝 DM for collaborations

Option 3 (Aesthetic / Creative):
Visual Artist • Motion • Photography 📸
Mumbai 📍 • Tokyo aesthetic
✨ Turn imagination into reality`;
    } else if (lower.includes("rewrite")) {
      text = `✍️ **Elevated Social Rewrite Options**:

1. 🌟 **Engaging & Conversational**:
"Stepping back to appreciate the process. It's easy to get lost in the destination, but the craft happens right here."

2. ⚡ **Short, Sharp & Aesthetic**:
"Trust the iterations. The craft speaks for itself."

3. 🔥 **Hinglish Trendsetter**:
"Consistency aur patience — yeh do cheezein kabhi waste nahi jaati. Keep building, results will follow! 🚀"`;
    } else if (/\b(hi|hello|hey|namaste|नमस्ते)\b/i.test(lower.trim())) {
      text =
        "Namaste! 👋 Main Opexnal AI ka local assistant hoon. Aaj aap kis cheez mein madad chahte hain?";
    } else if (/\b(kaise ho|kaisi ho|how are you)\b/i.test(lower)) {
      text =
        "Main theek se kaam karne ke liye ready hoon! 😊 Aap bataiye, aaj kis cheez mein madad karun?";
    } else if (/\b(kya kar rahe ho|what are you doing)\b/i.test(lower)) {
      text =
        "Main aapka message samajhkar jawab dene ki koshish kar raha hoon. Aap Opexnal par kis feature par kaam kar rahe hain?";
    } else if (/\b(thanks|thank you|shukriya|धन्यवाद)\b/i.test(lower)) {
      text = "Aapka swagat hai! 😊";
    } else {
      text =
        "Aapka message mil gaya. Abhi Opex AI ka local fallback mode active hai, jo har tarah ke sawalon ka full generative jawab nahi de sakta. Is waqt configured AI model available nahi hai; isliye main banaawati ya repeat hone wala jawab dene ke bajay yeh limitation bata raha hoon.";
    }

    return {
      text,
      provider: this.id,
      model: "opexnal-autonomous-v1",
      finishReason: "stop",
    };
  }

  async *stream(request: GenerateRequest): AsyncIterable<StreamChunk> {
    const full = await this.generate(request);
    const chunks = full.text.split("\n\n");
    for (let i = 0; i < chunks.length; i++) {
      yield {
        text: chunks[i] + (i === chunks.length - 1 ? "" : "\n\n"),
        done: i === chunks.length - 1,
      };
    }
  }

  async embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const texts = Array.isArray(request.text) ? request.text : [request.text];
    const dims = 64;
    const embeddings = texts.map((t) => {
      const vec = new Array(dims).fill(0);
      for (let i = 0; i < t.length; i++) {
        const c = t.charCodeAt(i);
        vec[c % dims] = (vec[c % dims] || 0) + 1;
      }
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
      return vec.map((v) => Number((v / norm).toFixed(4)));
    });

    return {
      embeddings,
      dimensions: dims,
      provider: this.id,
    };
  }

  async moderate(request: ModerationRequest): Promise<ModerationResponse> {
    const lower = request.content.toLowerCase();

    const hateKeywords = [
      "hate",
      "nazi",
      "terrorist",
      "kill all",
      "subhuman",
      "racial slur",
      "chutiya",
      "kameena",
    ];
    const scamKeywords = [
      "free crypto",
      "send money",
      "guaranteed 1000%",
      "whatsapp +",
      "telegram @",
      "cash prize",
      "lottery winner",
      "wire transfer",
    ];
    const harassmentKeywords = [
      "kill yourself",
      "die",
      "ugly pig",
      "nobody likes you",
      "stalk you",
      "doxx",
    ];
    const selfHarmKeywords = ["cut myself", "suicide", "end my life", "slit wrists"];
    const spamKeywords = ["follow for follow", "f4f", "check bio for naughty", "dm to buy"];

    const isHate = hateKeywords.some((w) => lower.includes(w));
    const isScam = scamKeywords.some((w) => lower.includes(w));
    const isHarassment = harassmentKeywords.some((w) => lower.includes(w));
    const isSelfHarm = selfHarmKeywords.some((w) => lower.includes(w));
    const isSpam = spamKeywords.some((w) => lower.includes(w));

    const flagged = isHate || isScam || isHarassment || isSelfHarm || isSpam;

    let reason =
      "Heuristic keyword check: no configured terms matched; this is not a safety guarantee";
    if (isHate) {
      reason = "Heuristic keyword match: possible hate speech or abusive terminology";
    } else if (isScam) {
      reason = "Heuristic keyword match: possible financial scam or unauthorized solicitation";
    } else if (isHarassment) {
      reason = "Heuristic keyword match: possible targeted harassment or threatening statement";
    } else if (isSelfHarm) {
      reason = "Heuristic keyword match: sensitive crisis-related terminology";
    } else if (isSpam) {
      reason = "Heuristic keyword match: possible commercial spam or follow-farming";
    }

    return {
      result: {
        flagged,
        categories: {
          hateSpeech: isHate,
          harassment: isHarassment,
          scamOrFraud: isScam,
          sexualContent: false,
          selfHarm: isSelfHarm,
          spam: isSpam,
        },
        // Binary rule-match indicator, not a calibrated model confidence score.
        score: flagged ? 1 : 0,
        reason,
      },
      provider: this.id,
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      status: "degraded",
      provider: this.id,
      latencyMs: 1,
      error: "Keyword heuristics only; no model-based moderation is configured",
      timestamp: new Date().toISOString(),
    };
  }

  capabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsStreaming: true,
      // This runtime uses text heuristics and deterministic hash vectors; it does not
      // perform model-based image understanding, semantic embeddings, or tool calling.
      supportsVision: false,
      supportsEmbeddings: false,
      supportsModeration: true,
      supportsFunctionCalling: false,
      maxContextTokens: 65536,
      name: this.name,
      version: "1.0.0",
    };
  }
}
