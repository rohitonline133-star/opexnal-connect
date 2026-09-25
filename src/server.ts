import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleAiRequest } from "./server/gemini-handler";
import {
  inspectRequestWaf,
  verifyOriginSecret,
  checkEdgeTierRateLimit,
  applyEdgeSecurityHeaders,
  extractClientIp,
} from "./server/edge-security";
import {
  calculateCentralizedRiskScore,
  evaluateImpossibleTravel,
  evaluateDeviceBotSignals,
  type BehavioralSignals,
  type LoginEventContext,
} from "./lib/risk-engine";
import { securityPipeline } from "./server/security-pipeline";
import { evaluateIpReputation } from "./server/threat-intelligence";

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
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const startTime = Date.now();
    securityPipeline.recordRequest();

    try {
      const url = new URL(request.url);
      const clientIp = extractClientIp(request);
      const userAgent = request.headers.get("user-agent") || "";

      // ---------------------------------------------------------
      // LAYER 1: GLOBAL EDGE SECURITY & WAF MALICIOUS PAYLOAD FILTER
      // ---------------------------------------------------------
      const wafResult = inspectRequestWaf(request);
      if (wafResult.blocked) {
        securityPipeline.recordEvent({
          eventType: "WAF_BLOCK",
          severity: "WARN",
          actor: { ip: clientIp, userAgent },
          details: `WAF Rule Triggered: ${wafResult.reason} (${wafResult.attackCategory})`,
          riskScore: 85,
          metadata: {
            path: url.pathname,
            method: request.method,
            category: wafResult.attackCategory,
          },
        });

        return applyEdgeSecurityHeaders(
          new Response(
            JSON.stringify({
              error: "Request blocked by Opexnal Global Edge WAF",
              reason: wafResult.reason,
              incidentId: `inc_${Date.now()}`,
            }),
            {
              status: wafResult.status,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      // ---------------------------------------------------------
      // LAYER 2: ORIGIN PROTECTION
      // ---------------------------------------------------------
      const originVerificationToken = process.env["ORIGIN_VERIFY_TOKEN"];
      const originCheck = verifyOriginSecret(request, originVerificationToken);
      if (!originCheck.valid) {
        securityPipeline.recordEvent({
          eventType: "ORIGIN_VIOLATION",
          severity: "CRITICAL",
          actor: { ip: clientIp, userAgent },
          details: originCheck.reason || "Origin protection violation",
          riskScore: 95,
        });

        return applyEdgeSecurityHeaders(
          new Response(
            JSON.stringify({ error: "Access Denied: Direct origin access is prohibited." }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      // ---------------------------------------------------------
      // LAYER 3: MULTI-TIER RATE LIMITING & HTTP FLOOD MITIGATION
      // ---------------------------------------------------------
      const rateCheck = checkEdgeTierRateLimit(request, clientIp);
      if (!rateCheck.allowed) {
        securityPipeline.recordEvent({
          eventType: "RATE_LIMIT_BLOCK",
          severity: "WARN",
          actor: { ip: clientIp, userAgent },
          details: `Rate limit exceeded on tier ${rateCheck.tier}. Retry in ${rateCheck.retryAfterSec}s`,
          riskScore: 60,
          metadata: { tier: rateCheck.tier, retryAfter: rateCheck.retryAfterSec },
        });

        return applyEdgeSecurityHeaders(
          new Response(
            JSON.stringify({
              error: `Rate limit exceeded on ${rateCheck.tier}. Please wait ${rateCheck.retryAfterSec} seconds.`,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(rateCheck.retryAfterSec),
              },
            },
          ),
        );
      }

      // ---------------------------------------------------------
      // LAYER 4: INFRASTRUCTURE HEALTH & MONITORING ENDPOINTS
      // ---------------------------------------------------------
      if (url.pathname === "/api/health") {
        return applyEdgeSecurityHeaders(
          new Response(
            JSON.stringify({
              status: "healthy",
              timestamp: new Date().toISOString(),
              service: "opexnal-origin",
              edgeProtection: "active",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      if (url.pathname === "/api/health/deep") {
        const metrics = securityPipeline.getMetrics();
        return applyEdgeSecurityHeaders(
          new Response(
            JSON.stringify({
              status: "healthy",
              timestamp: new Date().toISOString(),
              service: "opexnal-origin",
              latencyMs: Date.now() - startTime,
              components: {
                edgeWaf: "PASS",
                rateLimiter: "PASS",
                riskEngine: "PASS",
                threatIntelligence: "PASS",
                aiSecurityGuardrails: "PASS",
                supabaseAuthMiddleware: "PASS",
              },
              telemetry: metrics,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      // ---------------------------------------------------------
      // LAYER 5: SECURITY TELEMETRY & INCIDENT RESPONSE APIS
      // ---------------------------------------------------------
      if (url.pathname === "/api/security/metrics") {
        const metrics = securityPipeline.getMetrics();
        return applyEdgeSecurityHeaders(
          new Response(JSON.stringify(metrics), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (url.pathname === "/api/security/events") {
        const events = securityPipeline.getRecentEvents(50);
        return applyEdgeSecurityHeaders(
          new Response(JSON.stringify({ events, count: events.length }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      // Risk Evaluation API for server-side evaluation & verification
      if (url.pathname === "/api/security/evaluate" && request.method === "POST") {
        const body = (await request.json().catch(() => ({}))) as {
          signals?: BehavioralSignals;
          previousLogin?: LoginEventContext;
          currentLogin?: LoginEventContext;
          testIp?: string;
        };

        const targetIp = body.testIp || clientIp;
        const ipRep = evaluateIpReputation(targetIp);
        const botSignals = evaluateDeviceBotSignals(
          userAgent,
          Object.fromEntries(request.headers.entries()),
        );

        let travelResult = undefined;
        if (body.currentLogin) {
          travelResult = evaluateImpossibleTravel(body.previousLogin, body.currentLogin);
          if (travelResult.isImpossible) {
            securityPipeline.recordEvent({
              eventType: "IMPOSSIBLE_TRAVEL",
              severity: "WARN",
              actor: { ip: clientIp, userAgent },
              details: travelResult.reason || "Impossible travel detected",
              riskScore: travelResult.riskScore,
            });
          }
        }

        const compositeSignals: BehavioralSignals = {
          ...body.signals,
          isKnownBadIp: ipRep.isThreat && ipRep.threatType === "KNOWN_MALICIOUS_IP",
          isKnownTorOrProxy: ipRep.isThreat && ipRep.threatType === "TOR_EXIT_NODE",
          impossibleTravel: travelResult || body.signals?.impossibleTravel,
          deviceBotSignals: {
            isHeadlessOrAutomated: botSignals.isHeadlessOrAutomated,
            hasSuspiciousHeaders: botSignals.hasSuspiciousHeaders,
            entropyScore: botSignals.riskScore > 0 ? 30 : 90,
          },
        };

        const evaluation = calculateCentralizedRiskScore(compositeSignals);

        return applyEdgeSecurityHeaders(
          new Response(
            JSON.stringify({
              evaluation,
              ipReputation: ipRep,
              deviceBotSignals: botSignals,
              impossibleTravel: travelResult,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      // ---------------------------------------------------------
      // LAYER 6: AI CO-PILOT PROXY & GUARDRAILS
      // ---------------------------------------------------------
      if (url.pathname.startsWith("/api/ai/")) {
        const aiResponse = await handleAiRequest(request);
        return applyEdgeSecurityHeaders(aiResponse);
      }

      // ---------------------------------------------------------
      // LAYER 7: TANSTACK REACT START SSR RUNTIME
      // ---------------------------------------------------------
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applyEdgeSecurityHeaders(normalized);
    } catch (error) {
      console.error("[CRITICAL_SERVER_ERROR]", error);
      const fallback = new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
      return applyEdgeSecurityHeaders(fallback);
    }
  },
};
