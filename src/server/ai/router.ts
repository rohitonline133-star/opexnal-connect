import type { AIProvider } from "./provider-interface";
import { SelfHostedProviderAdapter } from "./adapters/self-hosted-adapter";
import { OpexnalAutonomousRuntimeAdapter } from "./adapters/opexnal-runtime-adapter";
import { CircuitBreaker } from "./circuit-breaker";

/**
 * Opexnal AI routes inference only to an Opexnal-controlled model server.
 * A deterministic runtime is registered for explicit non-generative utilities,
 * but is never presented as a real language model response.
 */
export class ModelRouter {
  private providers = new Map<string, AIProvider>();
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor() {
    this.registerProvider(new SelfHostedProviderAdapter());
    this.registerProvider(new OpexnalAutonomousRuntimeAdapter());
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
   * Fail closed: never silently route user prompts to a third-party provider
   * or deterministic placeholder when the Opexnal model server is unavailable.
   */
  public resolveProvider(): AIProvider {
    const selfHosted = this.providers.get("self_hosted") as SelfHostedProviderAdapter | undefined;
    if (!selfHosted?.isConfigured()) {
      throw new Error("OPEX_AI_MODEL_UNAVAILABLE: Configure OPEX_AI_MODEL_ENDPOINT to your Opexnal-hosted model server.");
    }

    const breaker = this.circuitBreakers.get("self_hosted");
    if (breaker && !breaker.canExecute()) {
      throw new Error("OPEX_AI_MODEL_UNAVAILABLE: Opexnal model server circuit breaker is open; retry after recovery.");
    }
    return selfHosted;
  }

  public getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}

export const globalModelRouter = new ModelRouter();
