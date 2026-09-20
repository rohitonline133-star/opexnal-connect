import { randomUUID } from "node:crypto";
import { dbQuery, withTransaction } from "../../db/index";
import { extractAuth, requireAuth } from "../../security/authorizer";
import { publishRealtimeEvent } from "../../realtime/realtime-engine";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleUsersRoutes(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // GET /api/v1/users/profile/:usernameOrId
  const profileMatch = pathname.match(/^\/api\/v1\/users\/profile\/([^/]+)$/);
  if (profileMatch && method === "GET") {
    const identifier = profileMatch[1];
    const auth = await extractAuth(request);
    const currentUserId = auth?.user.userId || null;

    const res = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM profiles WHERE id = $1 OR username = $2",
      [identifier, identifier],
    );

    if (res.rows.length === 0) {
      return json({ error: "Profile not found" }, 404);
    }

    const profile = res.rows[0];
    const targetUserId = profile["id"] as string;

    let isFollowing = false;
    let isBlocked = false;

    if (currentUserId && currentUserId !== targetUserId) {
      const fCheck = await dbQuery(
        "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
        [currentUserId, targetUserId],
      );
      isFollowing = fCheck.rows.length > 0;

      const bCheck = await dbQuery(
        "SELECT id FROM blocks WHERE blocker_id = $1 AND blocked_id = $2",
        [currentUserId, targetUserId],
      );
      isBlocked = bCheck.rows.length > 0;
    }

    return json({
      profile: {
        ...profile,
        isFollowing,
        isBlocked,
      },
    });
  }

  // PATCH /api/v1/users/profile (IDOR check: updates ONLY authenticated user's own profile)
  if (pathname === "/api/v1/users/profile" && method === "PATCH") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as {
      displayName?: string;
      bio?: string;
      website?: string;
      location?: string;
      avatarUrl?: string;
      isPrivate?: boolean;
    };

    await dbQuery(
      `UPDATE profiles
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           website = COALESCE($3, website),
           location = COALESCE($4, location),
           avatar_url = COALESCE($5, avatar_url),
           is_private = COALESCE($6, is_private),
           updated_at = now()
       WHERE id = $7`,
      [
        body.displayName ?? null,
        body.bio ?? null,
        body.website ?? null,
        body.location ?? null,
        body.avatarUrl ?? null,
        body.isPrivate !== undefined ? body.isPrivate : null,
        auth.user.userId,
      ],
    );

    const updated = await dbQuery("SELECT * FROM profiles WHERE id = $1", [auth.user.userId]);
    return json({ profile: updated.rows[0] });
  }

  // POST /api/v1/users/follow/:targetId
  const followMatch = pathname.match(/^\/api\/v1\/users\/follow\/([0-9a-f-]{36})$/i);
  if (followMatch && method === "POST") {
    const targetId = followMatch[1];
    const auth = await requireAuth(request);

    if (targetId === auth.user.userId) {
      return json({ error: "Cannot follow yourself" }, 400);
    }

    const existing = await dbQuery(
      "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
      [auth.user.userId, targetId],
    );

    if (existing.rows.length === 0) {
      await withTransaction(async (client) => {
        await client.query(
          "INSERT INTO follows (id, follower_id, following_id, created_at) VALUES ($1, $2, $3, now())",
          [randomUUID(), auth.user.userId, targetId],
        );
        await client.query(
          "UPDATE profiles SET following_count = following_count + 1 WHERE id = $1",
          [auth.user.userId],
        );
        await client.query(
          "UPDATE profiles SET followers_count = followers_count + 1 WHERE id = $1",
          [targetId],
        );

        await client.query(
          `INSERT INTO notifications (id, user_id, actor_id, type, entity_type, entity_id, message, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
          [
            randomUUID(),
            targetId,
            auth.user.userId,
            "follow",
            "user",
            auth.user.userId,
            `@${auth.user.username} started following you.`,
          ],
        );
      });

      publishRealtimeEvent(`user:${targetId}`, "notification:new", {
        type: "follow",
        actorUsername: auth.user.username,
      });
    }

    return json({ success: true, isFollowing: true });
  }

  // DELETE /api/v1/users/follow/:targetId
  if (followMatch && method === "DELETE") {
    const targetId = followMatch[1];
    const auth = await requireAuth(request);

    await withTransaction(async (client) => {
      const res = await client.query(
        "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
        [auth.user.userId, targetId],
      );
      if (res.rowCount > 0) {
        await client.query(
          "UPDATE profiles SET following_count = following_count - 1 WHERE id = $1",
          [auth.user.userId],
        );
        await client.query(
          "UPDATE profiles SET followers_count = followers_count - 1 WHERE id = $1",
          [targetId],
        );
      }
    });

    return json({ success: true, isFollowing: false });
  }

  // POST /api/v1/users/block/:targetId
  const blockMatch = pathname.match(/^\/api\/v1\/users\/block\/([0-9a-f-]{36})$/i);
  if (blockMatch && method === "POST") {
    const targetId = blockMatch[1];
    const auth = await requireAuth(request);

    if (targetId === auth.user.userId) return json({ error: "Cannot block yourself" }, 400);

    const existing = await dbQuery(
      "SELECT id FROM blocks WHERE blocker_id = $1 AND blocked_id = $2",
      [auth.user.userId, targetId],
    );

    if (existing.rows.length === 0) {
      await withTransaction(async (client) => {
        await client.query(
          "INSERT INTO blocks (id, blocker_id, blocked_id, created_at) VALUES ($1, $2, $3, now())",
          [randomUUID(), auth.user.userId, targetId],
        );
        // Remove follow relationships in both directions
        await client.query(
          "DELETE FROM follows WHERE (follower_id = $1 AND following_id = $2) OR (follower_id = $2 AND following_id = $1)",
          [auth.user.userId, targetId],
        );
      });
    }

    return json({ success: true, isBlocked: true });
  }

  // DELETE /api/v1/users/block/:targetId
  if (blockMatch && method === "DELETE") {
    const targetId = blockMatch[1];
    const auth = await requireAuth(request);

    await dbQuery("DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2", [
      auth.user.userId,
      targetId,
    ]);

    return json({ success: true, isBlocked: false });
  }

  // GET /api/v1/users/search?q=...
  if (pathname === "/api/v1/users/search" && method === "GET") {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").toLowerCase().trim();

    if (!q) return json({ users: [] });

    const res = await dbQuery<Record<string, unknown>>(
      "SELECT id, username, display_name, avatar_url, is_verified FROM profiles WHERE username = $1 LIMIT 20",
      [q],
    );

    return json({ users: res.rows });
  }

  return null;
}
