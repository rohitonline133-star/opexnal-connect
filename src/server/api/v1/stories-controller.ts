import { randomUUID } from "node:crypto";
import { dbQuery, withTransaction } from "../../db/index";
import { extractAuth, requireAuth, assertOwnership } from "../../security/authorizer";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleStoriesRoutes(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // GET /api/v1/stories/tray (Active 24h stories tray)
  if (pathname === "/api/v1/stories/tray" && method === "GET") {
    const auth = await extractAuth(request);
    const currentUserId = auth?.user.userId || null;
    const now = new Date().toISOString();

    const storiesRes = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM stories WHERE is_deleted = false ORDER BY created_at DESC",
    );

    // Filter by 24h expiration in memory/DB
    const activeStories = storiesRes.rows.filter((s) => {
      const exp = new Date(s["expires_at"] as string).getTime();
      return exp > Date.now();
    });

    // Group by user
    const usersMap = new Map<string, Record<string, unknown>[]>();
    for (const s of activeStories) {
      const uId = s["user_id"] as string;
      let list = usersMap.get(uId);
      if (!list) {
        list = [];
        usersMap.set(uId, list);
      }
      list.push(s);
    }

    const trayItems = [];
    for (const [userId, userStories] of usersMap.entries()) {
      const pRes = await dbQuery<{
        username: string;
        display_name: string;
        avatar_url: string | null;
      }>("SELECT username, display_name, avatar_url FROM profiles WHERE id = $1", [userId]);
      const userProfile = pRes.rows[0] || {
        username: "unknown",
        display_name: "User",
        avatar_url: null,
      };

      // Check if current user has viewed all stories
      let hasUnseen = true;
      if (currentUserId) {
        const storyIds = userStories.map((s) => s["id"] as string);
        const viewsRes = await dbQuery<{ story_id: string }>(
          "SELECT story_id FROM story_views WHERE viewer_id = $1",
          [currentUserId],
        );
        const viewedIds = new Set(viewsRes.rows.map((v) => v.story_id));
        hasUnseen = storyIds.some((id) => !viewedIds.has(id));
      }

      trayItems.push({
        user: {
          id: userId,
          username: userProfile.username,
          displayName: userProfile.display_name,
          avatarUrl: userProfile.avatar_url,
        },
        stories: userStories,
        hasUnseen,
      });
    }

    return json({ tray: trayItems });
  }

  // GET /api/v1/stories/user/:userId
  const userStoriesMatch = pathname.match(/^\/api\/v1\/stories\/user\/([^/]+)$/);
  if (userStoriesMatch && method === "GET") {
    const targetUserId = userStoriesMatch[1];
    const storiesRes = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM stories WHERE user_id = $1 AND is_deleted = false ORDER BY created_at ASC",
      [targetUserId],
    );

    const active = storiesRes.rows.filter(
      (s) => new Date(s["expires_at"] as string).getTime() > Date.now(),
    );
    return json({ stories: active });
  }

  // POST /api/v1/stories (Create story with 24-hour expiration)
  if (pathname === "/api/v1/stories" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as {
      mediaUrl?: string;
      mediaType?: string;
      caption?: string;
      audience?: string;
    };

    if (!body.mediaUrl) {
      return json({ error: "mediaUrl is required to publish a story" }, 400);
    }

    const storyId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    await dbQuery(
      `INSERT INTO stories (id, user_id, storage_path, media_type, caption, audience, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        storyId,
        auth.user.userId,
        body.mediaUrl,
        body.mediaType || "image",
        body.caption || "",
        body.audience || "public",
        expiresAt,
        now.toISOString(),
        now.toISOString(),
      ],
    );

    const res = await dbQuery("SELECT * FROM stories WHERE id = $1", [storyId]);
    return json({ story: res.rows[0] }, 201);
  }

  // POST /api/v1/stories/:id/view
  const viewMatch = pathname.match(/^\/api\/v1\/stories\/([0-9a-f-]{36})\/view$/i);
  if (viewMatch && method === "POST") {
    const storyId = viewMatch[1];
    const auth = await requireAuth(request);

    const existing = await dbQuery(
      "SELECT id FROM story_views WHERE story_id = $1 AND viewer_id = $2",
      [storyId, auth.user.userId],
    );

    if (existing.rows.length === 0) {
      await withTransaction(async (client) => {
        await client.query(
          "INSERT INTO story_views (id, story_id, viewer_id, created_at) VALUES ($1, $2, $3, now())",
          [randomUUID(), storyId, auth.user.userId],
        );
        await client.query("UPDATE stories SET views_count = views_count + 1 WHERE id = $1", [
          storyId,
        ]);
      });
    }

    return json({ success: true });
  }

  // DELETE /api/v1/stories/:id (IDOR Protection)
  const deleteMatch = pathname.match(/^\/api\/v1\/stories\/([0-9a-f-]{36})$/i);
  if (deleteMatch && method === "DELETE") {
    const storyId = deleteMatch[1];
    if (!storyId) return json({ error: "Story ID required" }, 400);
    const auth = await requireAuth(request);

    const sRes = await dbQuery<{ user_id: string }>("SELECT user_id FROM stories WHERE id = $1", [
      storyId,
    ]);
    if (sRes.rows.length === 0 || !sRes.rows[0]) return json({ error: "Story not found" }, 404);
    const targetStory = sRes.rows[0];

    if (targetStory.user_id !== auth.user.userId && auth.user.role !== "super_admin") {
      assertOwnership(targetStory.user_id, auth.user.userId, "story");
    }

    await dbQuery("UPDATE stories SET is_deleted = true WHERE id = $1", [storyId]);
    return json({ success: true, message: "Story deleted" });
  }

  return null;
}
