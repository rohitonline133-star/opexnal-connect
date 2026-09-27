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
      throw new Error(`Too many requests. Please retry in ${Math.ceil(rateCheck.resetMs / 1000)}s.`);
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
      // Execute with timeout
      const result = await Promise.race([
        provider.generate(request),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Provider response timed out (15s)")), 15000),
        ),
      ]);

      cb?.recordSuccess();
      outputResponse = result;
    } catch (err: unknown) {
      cb?.recordFailure();
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[OPEX-AI] Provider '${provider.id}' failed, activating autonomous fallback:`, errorMsg);

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
