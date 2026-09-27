import type { AIProvider } from "./provider-interface";
import { GeminiProviderAdapter } from "./adapters/gemini-adapter";
import { SelfHostedProviderAdapter } from "./adapters/self-hosted-adapter";
import { OpexnalAutonomousRuntimeAdapter } from "./adapters/opexnal-runtime-adapter";
import { CircuitBreaker } from "./circuit-breaker";

/**
 * OPEX AI Model Router & Orchestrator
 *
 * Directs traffic across model providers based on configuration, health, and circuit state.
 * Allows seamless hot-switching between Gemini, Self-Hosted clusters, and Opexnal native runtime.
 */
export class ModelRouter {
  private providers = new Map<string, AIProvider>();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private autonomousFallback: OpexnalAutonomousRuntimeAdapter;

  constructor() {
    this.autonomousFallback = new OpexnalAutonomousRuntimeAdapter();
    this.registerProvider(this.autonomousFallback);
    this.registerProvider(new GeminiProviderAdapter());
    this.registerProvider(new SelfHostedProviderAdapter());
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
    if (!this.circuitBreakers.has(provider.id)) {
      this.circuitBreakers.set(provider.id, new CircuitBreaker(provider.id));
    }
  }

  public getCircuitBreaker(providerId: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(providerId);
  }

  /**
   * Selects the most appropriate provider based on configuration and availability.
   */
  public resolveProvider(): AIProvider {
    const configTarget = (process.env["OPEX_AI_PROVIDER"] || "gemini").toLowerCase();

    // 1. If explicit self-hosted target
    if (configTarget === "self_hosted" || configTarget === "selfhosted") {
      const selfHosted = this.providers.get("self_hosted") as SelfHostedProviderAdapter | undefined;
      const cb = this.circuitBreakers.get("self_hosted");
      if (selfHosted?.isConfigured() && cb?.canExecute()) {
        return selfHosted;
      }
    }

    // 2. If Gemini target (current transitional default)
    if (configTarget === "gemini") {
      const gemini = this.providers.get("gemini") as GeminiProviderAdapter | undefined;
      const cb = this.circuitBreakers.get("gemini");
      if (gemini?.isConfigured() && cb?.canExecute()) {
        return gemini;
      }
    }

    // 3. Always fallback to the Opexnal Autonomous Runtime
    return this.autonomousFallback;
  }

  public getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}

export const globalModelRouter = new ModelRouter();
