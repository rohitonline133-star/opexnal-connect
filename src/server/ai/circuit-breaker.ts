/**
 * OPEX AI Circuit Breaker
 *
 * Prevents cascading service degradation by isolating failing providers
 * and triggering instant fallback to the autonomous local runtime.
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  public readonly name: string;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private failures = 0;
  private state: CircuitState = "CLOSED";
  private nextAttempt = 0;

  constructor(name: string, failureThreshold = 3, resetTimeoutMs = 15000) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  public getState(): CircuitState {
    if (this.state === "OPEN" && Date.now() > this.nextAttempt) {
      this.state = "HALF_OPEN";
    }
    return this.state;
  }

  public recordSuccess(): void {
    this.failures = 0;
    this.state = "CLOSED";
  }

  public recordFailure(): void {
    this.failures++;
    if (this.failures >= this.failureThreshold || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
    }
  }

  public canExecute(): boolean {
    return this.getState() !== "OPEN";
  }

  public reset(): void {
    this.failures = 0;
    this.state = "CLOSED";
    this.nextAttempt = 0;
  }
}
