/**
 * Resolve a first-party API path to the configured API origin.
 *
 * In local development, leave VITE_OPEXNAL_API_URL unset to use the Vite proxy.
 * Production deployments must set VITE_OPEXNAL_API_URL to the public HTTPS API origin.
 */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const configuredOrigin = (
    import.meta.env as ImportMetaEnv & { VITE_OPEXNAL_API_URL?: string }
  ).VITE_OPEXNAL_API_URL?.trim();

  if (!configuredOrigin) return normalizedPath;
  const origin = configuredOrigin.replace(/\/+$/, "");
  if (!import.meta.env.DEV && !origin.startsWith("https://") && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    throw new Error("VITE_OPEXNAL_API_URL must use HTTPS in production.");
  }
  return `${origin}${normalizedPath}`;
}
