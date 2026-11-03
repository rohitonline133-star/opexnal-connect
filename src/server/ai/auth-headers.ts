/**
 * Build the minimum authentication headers needed when Opex AI asks the
 * first-party API to verify a browser session. Never forward unrelated cookies.
 */
export function createFirstPartyAuthHeaders(request: Request): Headers | null {
  const headers = new Headers();
  const authorization = request.headers.get("authorization") || "";
  if (authorization.startsWith("Bearer ")) {
    headers.set("Authorization", authorization);
    return headers;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== "opexnal_session") continue;
    const value = part.slice(separator + 1).trim();
    if (!/^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$/.test(value)) return null;
    headers.set("Cookie", `opexnal_session=${value}`);
    const origin = request.headers.get("origin");
    if (origin) headers.set("Origin", origin);
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite) headers.set("Sec-Fetch-Site", fetchSite);
    return headers;
  }
  return null;
}
