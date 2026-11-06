export function boundedInteger(value, fallback, minimum, maximum, name) {
  const candidate =
    value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isSafeInteger(candidate) || candidate < minimum || candidate > maximum) {
    throw new RangeError(`${name} must be an integer from ${minimum} to ${maximum}.`);
  }
  return candidate;
}

export function workerIdentifier(value, fallback) {
  const candidate = typeof value === "string" ? value.trim() : "";
  const identifier = candidate || fallback;
  if (identifier.length > 120 || !/^[a-zA-Z0-9._:-]+$/.test(identifier)) {
    throw new RangeError("OUTBOX_WORKER_ID must be 1–120 safe characters.");
  }
  return identifier;
}
