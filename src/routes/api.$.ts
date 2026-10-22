import { createFileRoute } from "@tanstack/react-router";
import { handleAiRequest } from "@/server/ai/http-handler";
import { handleAuthApiRequest } from "@/server/auth-handler";

const allowedMethods = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

async function proxyToFirstPartyApi({ request }: { request: Request }) {
  const incomingUrl = new URL(request.url);
  if (incomingUrl.pathname.startsWith("/api/ai/")) {
    return handleAiRequest(request);
  }
  if (incomingUrl.pathname.startsWith("/api/auth/")) {
    return handleAuthApiRequest(request);
  }

  const method = request.method.toUpperCase();
  if (!allowedMethods.has(method)) {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const configuredOrigin = process.env["OPEXNAL_API_URL"]?.trim();
  if (!configuredOrigin) {
    return Response.json(
      { error: "The first-party API is not configured. Set OPEXNAL_API_URL on the web server." },
      { status: 503 },
    );
  }

  let origin: URL;
  try {
    origin = new URL(configuredOrigin);
  } catch {
    return Response.json({ error: "OPEXNAL_API_URL is invalid." }, { status: 503 });
  }
  if (
    origin.protocol !== "https:" &&
    !(origin.protocol === "http:" && ["localhost", "127.0.0.1", "api"].includes(origin.hostname))
  ) {
    return Response.json({ error: "The first-party API origin must use HTTPS." }, { status: 503 });
  }

  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname.replace(/^\/api\//, "/api/") + incoming.search, origin);
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept", "x-request-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    body = await request.arrayBuffer();
  }

  try {
    const requestInit: RequestInit = {
      method,
      headers,
      redirect: "manual",
      cache: "no-store",
    };
    if (body !== undefined) requestInit.body = body;
    const upstream = await fetch(target, requestInit);
    const responseHeaders = new Headers();
    for (const name of ["content-type", "cache-control", "location", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set("cache-control", "no-store");
    return new Response(method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ error: "The first-party API could not be reached." }, { status: 502 });
  }
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: proxyToFirstPartyApi,
      HEAD: proxyToFirstPartyApi,
      POST: proxyToFirstPartyApi,
      PUT: proxyToFirstPartyApi,
      PATCH: proxyToFirstPartyApi,
      DELETE: proxyToFirstPartyApi,
      OPTIONS: proxyToFirstPartyApi,
    },
  },
});
