import { globalModelRouter, ModelRouter } from "./router";
import { SafetyEngine } from "./safety-engine";
import { RateLimiter } from "./rate-limiter";
import { AuditLogger } from "./audit-logger";
import { OpexnalAutonomousRuntimeAdapter } from "./adapters/opexnal-runtime-adapter";
import type {
  GenerateRequest,
  GenerateResponse,
  ModerationRequest,
  ModerationResponse,
  HealthCheckResult,
  ProviderCapabilities,
  AuditLogEntry,
} from "./types";

export interface GatewayExecutionOptions {
  clientIp?: string | undefined;
  userId?: string | undefined;
  endpoint: string;
}

function logAudit(
  base: Omit<AuditLogEntry, "userId" | "ipAddress">,
  options: GatewayExecutionOptions,
): void {
  const entry: AuditLogEntry = { ...base };
  if (options.userId) entry.userId = options.userId;
  if (options.clientIp) entry.ipAddress = options.clientIp;
  AuditLogger.log(entry);
}

/**
 * OPEX AI Central Gateway
 *
 * Coordinates execution flow:
 * Request
 * → Correlation ID Assignment
 * → Rate Limiting & Abuse Protection
 * → Input Safety & Injection Filter
 * → Model Routing & Circuit Breaking
 * → Provider Execution (with local Autonomous fallback)
 * → Output Sanitization
 * → Privacy-Preserving Audit Logging
 * → Response
 */
export class OpexAiGateway {
  private fallbackEngine = new OpexnalAutonomousRuntimeAdapter();
  private router: ModelRouter;

  constructor(router: ModelRouter = globalModelRouter) {
    this.router = router;
  }

  public async generate(
    request: GenerateRequest,
    options: GatewayExecutionOptions,
  ): Promise<{ response: GenerateResponse; correlationId: string }> {
    const correlationId =
      request.correlationId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const start = Date.now();
    const identifier = options.userId || options.clientIp || "anonymous";

    // 1. Rate Limiting Check
    const rateCheck = RateLimiter.check(identifier, Boolean(options.userId));
    if (!rateCheck.allowed) {
      logAudit(
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          correlationId,
          endpoint: options.endpoint,
          provider: "gateway",
          model: "rate_limiter",
          action: "generate",
          status: "rate_limited",
          latencyMs: Date.now() - start,
          promptLength: 0,
          errorMessage: "Rate limit exceeded",
        },
        options,
      );
      throw new Error(
        `Too many requests. Please retry in ${Math.ceil(rateCheck.resetMs / 1000)}s.`,
      );
    }

    // 2. Input Safety & Prompt Injection Guard
    const userPrompt = request.messages
      .map((m) => m.parts.map((p) => p.text || "").join(" "))
      .join("\n");
    const safetyCheck = SafetyEngine.checkInput(userPrompt);

    if (!safetyCheck.allowed) {
      logAudit(
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          correlationId,
          endpoint: options.endpoint,
          provider: "gateway",
          model: "safety_engine",
          action: "generate",
          status: "blocked_safety",
          latencyMs: Date.now() - start,
          promptLength: userPrompt.length,
          safetyFlagged: true,
          errorMessage: safetyCheck.reason || "Safety check failed",
        },
        options,
      );
      throw new Error(`Request rejected by Opexnal Safety Engine: ${safetyCheck.reason}`);
    }

    // 3. Resolve active model provider
    const provider = this.router.resolveProvider();
    const cb = this.router.getCircuitBreaker(provider.id);

    let outputResponse: GenerateResponse;
    try {
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Provider response timed out (10s)")), 10000);
        timeoutId.unref();
      });

      try {
        const result = await Promise.race([provider.generate(request), timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
        cb?.recordSuccess();
        outputResponse = result;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    } catch (err: unknown) {
      cb?.recordFailure();
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[OPEX-AI] Provider '${provider.id}' failed, activating autonomous fallback:`,
        errorMsg,
      );

      // Graceful failover to Opexnal native local runtime
      outputResponse = await this.fallbackEngine.generate(request);
      outputResponse.provider = `${this.fallbackEngine.id}_fallback`;
    }

    // 4. Output Sanitization
    outputResponse.text = SafetyEngine.checkOutput(outputResponse.text);

    // 5. Audit Logging
    logAudit(
      {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        correlationId,
        endpoint: options.endpoint,
        provider: outputResponse.provider,
        model: outputResponse.model,
        action: "generate",
        status: "success",
        latencyMs: Date.now() - start,
        promptLength: userPrompt.length,
        responseLength: outputResponse.text.length,
      },
      options,
    );

    return { response: outputResponse, correlationId };
  }

  public async moderate(
    request: ModerationRequest,
    options: GatewayExecutionOptions,
  ): Promise<ModerationResponse> {
    const correlationId = `mod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const start = Date.now();
    const provider = this.router.resolveProvider();

    try {
      const response = await provider.moderate(request);
      logAudit(
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          correlationId,
          endpoint: options.endpoint,
          provider: response.provider,
          model: "moderation",
          action: "moderate",
          status: "success",
          latencyMs: Date.now() - start,
          promptLength: request.content.length,
          safetyFlagged: response.result.flagged,
        },
        options,
      );
      return response;
    } catch (err) {
      // Fallback to local autonomous moderation
      const response = await this.fallbackEngine.moderate(request);
      logAudit(
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          correlationId,
          endpoint: options.endpoint,
          provider: response.provider,
          model: "moderation_fallback",
          action: "moderate",
          status: "success",
          latencyMs: Date.now() - start,
          promptLength: request.content.length,
          safetyFlagged: response.result.flagged,
          errorMessage: err instanceof Error ? err.message : String(err),
        },
        options,
      );
      return response;
    }
  }

  public async generateImage(
    prompt: string,
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1",
    options: GatewayExecutionOptions = { endpoint: "/api/ai/generate-image" },
  ): Promise<{ imageUrl: string; mimeType: string; provider: string }> {
    const correlationId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const start = Date.now();
    const provider = this.router.resolveProvider() as unknown as {
      generateImage?: (p: string, a: string) => Promise<{ imageUrl: string; mimeType: string }>;
      id: string;
    };

    try {
      if (typeof provider.generateImage === "function") {
        const result = await provider.generateImage(prompt, aspectRatio);
        logAudit(
          {
            id: `aud_${Date.now()}`,
            timestamp: new Date().toISOString(),
            correlationId,
            endpoint: options.endpoint,
            provider: provider.id,
            model: "image-gen",
            action: "generate-image",
            status: "success",
            latencyMs: Date.now() - start,
            promptLength: prompt.length,
          },
          options,
        );
        return { ...result, provider: provider.id };
      }
    } catch (err) {
      console.warn("[OPEX-AI] Image generation provider failed, fallback active:", err);
    }

    const fallbackResult = await this.fallbackEngine.generateImage(prompt, aspectRatio);
    logAudit(
      {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        correlationId,
        endpoint: options.endpoint,
        provider: "opex_runtime_fallback",
        model: "svg-synthesizer",
        action: "generate-image",
        status: "success",
        latencyMs: Date.now() - start,
        promptLength: prompt.length,
      },
      options,
    );
    return { ...fallbackResult, provider: "opex_runtime_fallback" };
  }

  public async editImage(
    prompt: string,
    base64Image: string,
    mimeType = "image/png",
    options: GatewayExecutionOptions = { endpoint: "/api/ai/edit-image" },
  ): Promise<{ imageUrl: string; mimeType: string; provider: string }> {
    const correlationId = `edit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const start = Date.now();
    const provider = this.router.resolveProvider() as unknown as {
      editImage?: (p: string, img: string, m: string) => Promise<{ imageUrl: string; mimeType: string }>;
      id: string;
    };

    try {
      if (typeof provider.editImage === "function") {
        const result = await provider.editImage(prompt, base64Image, mimeType);
        logAudit(
          {
            id: `aud_${Date.now()}`,
            timestamp: new Date().toISOString(),
            correlationId,
            endpoint: options.endpoint,
            provider: provider.id,
            model: "image-edit",
            action: "edit-image",
            status: "success",
            latencyMs: Date.now() - start,
            promptLength: prompt.length,
          },
          options,
        );
        return { ...result, provider: provider.id };
      }
    } catch (err) {
      console.warn("[OPEX-AI] Image edit provider failed, fallback active:", err);
    }

    const fallbackResult = await this.fallbackEngine.editImage(prompt, base64Image, mimeType);
    return { ...fallbackResult, provider: "opex_runtime_fallback" };
  }

  public async transcribeAudio(
    base64Audio: string,
    mimeType = "audio/wav",
    options: GatewayExecutionOptions = { endpoint: "/api/ai/transcribe" },
  ): Promise<{ text: string; provider: string }> {
    const correlationId = `asr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const start = Date.now();
    const provider = this.router.resolveProvider() as unknown as {
      transcribeAudio?: (a: string, m: string) => Promise<{ text: string }>;
      id: string;
    };

    try {
      if (typeof provider.transcribeAudio === "function") {
        const result = await provider.transcribeAudio(base64Audio, mimeType);
        logAudit(
          {
            id: `aud_${Date.now()}`,
            timestamp: new Date().toISOString(),
            correlationId,
            endpoint: options.endpoint,
            provider: provider.id,
            model: "transcribe",
            action: "transcribe-audio",
            status: "success",
            latencyMs: Date.now() - start,
            promptLength: base64Audio.length,
          },
          options,
        );
        return { ...result, provider: provider.id };
      }
    } catch (err) {
      console.warn("[OPEX-AI] Audio transcribe failed, fallback active:", err);
    }

    const fallback = await this.fallbackEngine.transcribeAudio(base64Audio, mimeType);
    return { ...fallback, provider: "opex_runtime_fallback" };
  }

  public async generateSpeech(
    text: string,
    voiceName: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr" = "Kore",
    options: GatewayExecutionOptions = { endpoint: "/api/ai/speech" },
  ): Promise<{ audioBase64: string; mimeType: string; provider: string }> {
    const correlationId = `tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const start = Date.now();
    const provider = this.router.resolveProvider() as unknown as {
      generateSpeech?: (t: string, v: string) => Promise<{ audioBase64: string; mimeType: string }>;
      id: string;
    };

    try {
      if (typeof provider.generateSpeech === "function") {
        const result = await provider.generateSpeech(text, voiceName);
        logAudit(
          {
            id: `aud_${Date.now()}`,
            timestamp: new Date().toISOString(),
            correlationId,
            endpoint: options.endpoint,
            provider: provider.id,
            model: "tts",
            action: "generate-speech",
            status: "success",
            latencyMs: Date.now() - start,
            promptLength: text.length,
          },
          options,
        );
        return { ...result, provider: provider.id };
      }
    } catch (err) {
      console.warn("[OPEX-AI] Speech synthesis failed, fallback active:", err);
    }

    const fallback = await this.fallbackEngine.generateSpeech(text, voiceName);
    return { ...fallback, provider: "opex_runtime_fallback" };
  }

  public async startVideo(
    prompt: string,
    aspectRatio: "16:9" | "9:16" = "16:9",
    options: GatewayExecutionOptions = { endpoint: "/api/ai/generate-video" },
  ): Promise<{ operationName: string; provider: string }> {
    const provider = this.router.resolveProvider() as unknown as {
      startVideo?: (p: string, a: string) => Promise<{ operationName: string }>;
      id: string;
    };

    try {
      if (typeof provider.startVideo === "function") {
        const result = await provider.startVideo(prompt, aspectRatio);
        return { ...result, provider: provider.id };
      }
    } catch (err) {
      console.warn("[OPEX-AI] Video start failed, fallback active:", err);
    }

    const fallback = await this.fallbackEngine.startVideo(prompt, aspectRatio);
    return { ...fallback, provider: "opex_runtime_fallback" };
  }

  public async getVideoStatus(
    operationName: string,
  ): Promise<{ done: boolean; videoUri?: string }> {
    const provider = this.router.resolveProvider() as unknown as {
      getVideoStatus?: (op: string) => Promise<{ done: boolean; videoUri?: string }>;
    };

    try {
      if (typeof provider.getVideoStatus === "function") {
        return await provider.getVideoStatus(operationName);
      }
    } catch (err) {
      console.warn("[OPEX-AI] Video status failed, fallback active:", err);
    }

    return await this.fallbackEngine.getVideoStatus(operationName);
  }

  public async getHealth(): Promise<{
    status: string;
    activeProvider: string;
    allProviders: HealthCheckResult[];
    timestamp: string;
  }> {
    const providers = this.router.getAllProviders();
    const checks = await Promise.all(providers.map((p) => p.healthCheck()));
    const active = this.router.resolveProvider();

    return {
      status: "operational",
      activeProvider: active.id,
      allProviders: checks,
      timestamp: new Date().toISOString(),
    };
  }

  public getCapabilities(): ProviderCapabilities {
    return this.router.resolveProvider().capabilities();
  }
}

export const opexAiGateway = new OpexAiGateway();
