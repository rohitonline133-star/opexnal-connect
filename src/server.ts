import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleAiRequest } from "./server/gemini-handler";
import {
  handleSecurityPreflight,
  handleSecurityApiRoutes,
  applySecurityHeaders,
} from "./server/security/security-middleware";
import { handleApiV1Request } from "./server/api/v1/index";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // 1. Defense-in-depth preflight: WAF, rate-limiting, and session validation
      const preflight = await handleSecurityPreflight(request);
      if (preflight.blockedResponse) {
        return preflight.blockedResponse;
      }

      const url = new URL(request.url);

      // 2. First-party Versioned Backend API (/api/v1/*)
      if (url.pathname.startsWith("/api/v1/")) {
        const apiResponse = await handleApiV1Request(
          request,
          preflight.clientContext.ip,
          preflight.clientContext.userAgent || "unknown",
          preflight.clientContext.fingerprint,
        );
        if (apiResponse) {
          const newHeaders = new Headers(apiResponse.headers);
          applySecurityHeaders(newHeaders);
          return new Response(apiResponse.body, {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            headers: newHeaders,
          });
        }
      }

      // 3. Dedicated Security Subsystem API endpoints
      if (url.pathname.startsWith("/api/security")) {
        const secResponse = await handleSecurityApiRoutes(request, preflight.clientContext);
        if (secResponse) return secResponse;
      }

      // 3. AI Service Endpoints
      if (url.pathname.startsWith("/api/ai/")) {
        const aiResponse = await handleAiRequest(request);
        const newHeaders = new Headers(aiResponse.headers);
        applySecurityHeaders(newHeaders);
        return new Response(aiResponse.body, {
          status: aiResponse.status,
          statusText: aiResponse.statusText,
          headers: newHeaders,
        });
      }

      // 4. SSR and Application handler
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalizedResponse = await normalizeCatastrophicSsrResponse(response);

      // Enrich all application responses with enterprise security headers
      const enrichedHeaders = new Headers(normalizedResponse.headers);
      applySecurityHeaders(enrichedHeaders);

      return new Response(normalizedResponse.body, {
        status: normalizedResponse.status,
        statusText: normalizedResponse.statusText,
        headers: enrichedHeaders,
      });
    } catch (error) {
      console.error(error);
      const errorHeaders = new Headers({ "content-type": "text/html; charset=utf-8" });
      applySecurityHeaders(errorHeaders);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: errorHeaders,
      });
    }
  },
};
