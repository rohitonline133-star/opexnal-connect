/**
 * Transitional Gemini Handler (Backward Compatibility Wrapper)
 *
 * NOTE: The application now routes all AI requests through the provider-independent
 * OPEX AI Gateway in src/server/ai/.
 * This file is preserved for backward compatibility and routes directly into the gateway.
 */

import { handleAiRequest as gatewayHandleAiRequest } from "./ai/http-handler";

export async function handleAiRequest(request: Request): Promise<Response> {
  return gatewayHandleAiRequest(request);
}
