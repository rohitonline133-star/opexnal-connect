import type { AuditLogEntry } from "./types";
import { SafetyEngine } from "./safety-engine";

/**
 * OPEX AI Observability & Audit Logger
 *
 * Implements privacy-preserving audit logging:
 * - Structured request correlation IDs
 * - Zero logging of passwords, tokens, API keys, or private messages
 * - In-memory ring buffer for telemetry audits
 */
export class AuditLogger {
  private static buffer: AuditLogEntry[] = [];
  private static readonly MAX_BUFFER_SIZE = 250;

  public static log(entry: AuditLogEntry): void {
    // Redact any accidental sensitive data in error messages
    const sanitizedEntry: AuditLogEntry = {
      ...entry,
    };
    if (entry.errorMessage) {
      sanitizedEntry.errorMessage = SafetyEngine.redactSecrets(entry.errorMessage);
    }

    this.buffer.push(sanitizedEntry);
    if (this.buffer.length > this.MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }

    // Controlled structured emission without secret exposure
    const statusIcon = entry.status === "success" ? "✓" : "⚠";
    console.log(
      `[OPEX-AI][${entry.correlationId}] ${statusIcon} ${entry.endpoint} via ${entry.provider}/${entry.model} (${entry.latencyMs}ms) - ${entry.status}`,
    );
  }

  public static getRecentLogs(limit = 50): AuditLogEntry[] {
    return this.buffer.slice(-limit);
  }

  public static clear(): void {
    this.buffer = [];
  }
}
