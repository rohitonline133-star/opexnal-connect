const SESSION_COOKIE_NAME = "opexnal_session";
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60;

export function parseSessionCookie(cookieHeader) {
  if (typeof cookieHeader !== "string" || cookieHeader.length > 8192) return "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== SESSION_COOKIE_NAME) continue;
    const value = part.slice(separator + 1).trim();
    // JWT compact serialization contains only URL-safe characters and dots.
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value) ? value : "";
  }
  return "";
}

export function createSessionCookie(token, { secure = true } = {}) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    throw new TypeError("A valid compact session token is required.");
  }
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function createClearedSessionCookie({ secure = true } = {}) {
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function isAllowedCookieRequest(origin, fetchSite, allowedOrigins) {
  if (typeof origin !== "string" || !Array.isArray(allowedOrigins)) return false;
  if (!allowedOrigins.includes(origin)) return false;
  if (fetchSite === "cross-site") return false;
  return true;
}
