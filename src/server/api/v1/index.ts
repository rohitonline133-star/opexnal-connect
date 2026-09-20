import { handleAuthRoutes } from "./auth-controller";
import { handlePostsRoutes } from "./posts-controller";
import { handleReelsRoutes } from "./reels-controller";
import { handleStoriesRoutes } from "./stories-controller";
import { handleCommentsRoutes } from "./comments-controller";
import { handleMessagesRoutes } from "./messages-controller";
import { handleUsersRoutes } from "./users-controller";
import { handleSettingsAndSecurityRoutes } from "./settings-controller";
import { handleStorageRoutes } from "./storage-controller";
import { handleRealtimeSseConnection } from "../../realtime/realtime-engine";
import { AuthorizationError } from "../../security/authorizer";

export async function handleApiV1Request(
  request: Request,
  clientIp: string,
  userAgent: string,
  fingerprint: string,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Realtime SSE stream route
  if (pathname === "/api/v1/realtime/stream") {
    return handleRealtimeSseConnection(request);
  }

  try {
    // 1. Auth routes
    const authRes = await handleAuthRoutes(request, pathname, clientIp, userAgent, fingerprint);
    if (authRes) return authRes;

    // 2. Posts routes
    const postsRes = await handlePostsRoutes(request, pathname);
    if (postsRes) return postsRes;

    // 3. Reels routes
    const reelsRes = await handleReelsRoutes(request, pathname);
    if (reelsRes) return reelsRes;

    // 4. Stories routes
    const storiesRes = await handleStoriesRoutes(request, pathname);
    if (storiesRes) return storiesRes;

    // 5. Comments routes
    const commentsRes = await handleCommentsRoutes(request, pathname);
    if (commentsRes) return commentsRes;

    // 6. Messages routes
    const messagesRes = await handleMessagesRoutes(request, pathname);
    if (messagesRes) return messagesRes;

    // 7. Users routes
    const usersRes = await handleUsersRoutes(request, pathname);
    if (usersRes) return usersRes;

    // 8. Settings & Security routes
    const settingsRes = await handleSettingsAndSecurityRoutes(request, pathname);
    if (settingsRes) return settingsRes;

    // 9. Storage routes
    const storageRes = await handleStorageRoutes(request, pathname);
    if (storageRes) return storageRes;

    return null;
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { "content-type": "application/json" },
      });
    }

    console.error(`[API V1 UNHANDLED ERROR] ${pathname}:`, error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
