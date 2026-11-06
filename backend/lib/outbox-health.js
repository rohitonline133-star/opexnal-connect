export function summarizeOutboxHealth(row, thresholds = {}) {
  const pendingCount = Number(row?.pending_count);
  const processingCount = Number(row?.processing_count);
  const deadCount = Number(row?.dead_count);
  const oldestPendingSeconds =
    row?.oldest_pending_seconds == null ? null : Number(row.oldest_pending_seconds);
  const staleProcessingCount = Number(row?.stale_processing_count);
  const publishedLastFiveMinutes = Number(row?.published_last_five_minutes ?? 0);
  const deadByEventType = row?.dead_by_event_type ?? {};
  for (const [name, value] of Object.entries({
    pendingCount,
    processingCount,
    deadCount,
    staleProcessingCount,
    ...(oldestPendingSeconds === null ? {} : { oldestPendingSeconds }),
  })) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError(`Outbox health field ${name} must be a non-negative integer.`);
    }
  }
  const maxPendingAgeSeconds = thresholds.maxPendingAgeSeconds ?? 300;
  const maxStaleProcessing = thresholds.maxStaleProcessing ?? 0;
  const maxDeadEvents = thresholds.maxDeadEvents ?? 0;
  for (const [name, value] of Object.entries({
    maxPendingAgeSeconds,
    maxStaleProcessing,
    maxDeadEvents,
  })) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError(`Outbox health threshold ${name} must be a non-negative integer.`);
    }
  }
  if (!deadByEventType || typeof deadByEventType !== "object" || Array.isArray(deadByEventType)) {\n    throw new TypeError("Outbox deadByEventType must be an object.");\n  }\n  for (const [eventType, count] of Object.entries(deadByEventType)) {\n    if (!eventType || !Number.isSafeInteger(Number(count)) || Number(count) < 0) {\n      throw new TypeError("Outbox deadByEventType entries must have a name and non-negative integer count.");\n    }\n  }\n  const alerts = [];
  if (deadCount > maxDeadEvents) alerts.push("dead_events_above_threshold");
  if (staleProcessingCount > maxStaleProcessing) alerts.push("stale_processing_above_threshold");
  if (oldestPendingSeconds !== null && oldestPendingSeconds > maxPendingAgeSeconds) {
    alerts.push("oldest_pending_age_above_threshold");
  }
  return {
    status: alerts.length ? "degraded" : "healthy",
    pendingCount,
    processingCount,
    deadCount,
    staleProcessingCount,
    oldestPendingSeconds,
    alerts,
  };
}
