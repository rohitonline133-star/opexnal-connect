import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleAiRequest } from "./server/ai/http-handler";
import { handleAuthApiRequest } from "./server/auth-handler";

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

async function proxyFirstPartyApi(request: Request): Promise<Response> {
  const configuredOrigin =
    process.env["OPEXNAL_API_URL"] || process.env["VITE_OPEXNAL_API_URL"];
  if (!configuredOrigin) {
    return Response.json(
      {
        error:
          "Opexnal's first-party API is not configured. Set OPEXNAL_API_URL on the web server.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let apiOrigin: URL;
  try {
    apiOrigin = new URL(configuredOrigin);
  } catch {
    return Response.json({ error: "OPEXNAL_API_URL is invalid." }, { status: 503 });
  }
  const isLocalHttp =
    process.env["NODE_ENV"] !== "production" &&
    apiOrigin.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1"].includes(apiOrigin.hostname);
  if (apiOrigin.protocol !== "https:" && !isLocalHttp) {
    return Response.json(
      { error: "The first-party API must use HTTPS outside local development." },
      { status: 503 },
    );
  }

  const incomingUrl = new URL(request.url);
  const target = new URL(incomingUrl.pathname + incomingUrl.search, apiOrigin);
  const headers = new Headers(request.headers);
  for (const header of ["host", "connection", "content-length", "cookie", "origin"]) {
    headers.delete(header);
  }

  try {
    const method = request.method.toUpperCase();
    const body =
      method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
    const requestInit: RequestInit = {
      method,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    };
    if (body !== undefined) requestInit.body = body;
    const upstream = await fetch(target, requestInit);
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { error: "The first-party API could not be reached." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
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
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/ai/")) {
        return await handleAiRequest(request);
      }
      if (url.pathname.startsWith("/api/v1/")) {
        return await proxyFirstPartyApi(request);
      }
      if (url.pathname.startsWith("/api/auth/")) {
        return await handleAuthApiRequest(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
