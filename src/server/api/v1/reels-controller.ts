import { randomUUID } from "node:crypto";
import { dbQuery, withTransaction } from "../../db/index";
import { extractAuth, requireAuth, assertOwnership } from "../../security/authorizer";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleReelsRoutes(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // GET /api/v1/reels
  if (pathname === "/api/v1/reels" && method === "GET") {
    const auth = await extractAuth(request);
    const currentUserId = auth?.user.userId || null;

    const reelsRes = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM reels WHERE is_deleted = false ORDER BY created_at DESC LIMIT 30",
    );

    const enriched = await Promise.all(reelsRes.rows.map((r) => enrichReel(r, currentUserId)));

    return json({ reels: enriched });
  }

  // GET /api/v1/reels/:id
  const singleReelMatch = pathname.match(/^\/api\/v1\/reels\/([0-9a-f-]{36})$/i);
  if (singleReelMatch && method === "GET") {
    const reelId = singleReelMatch[1];
    const auth = await extractAuth(request);
    const currentUserId = auth?.user.userId || null;

    const res = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM reels WHERE id = $1 AND is_deleted = false",
      [reelId],
    );
    if (res.rows.length === 0 || !res.rows[0]) {
      return json({ error: "Reel not found" }, 404);
    }

    const reel = await enrichReel(res.rows[0], currentUserId);
    return json({ reel });
  }

  // POST /api/v1/reels
  if (pathname === "/api/v1/reels" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as {
      caption?: string;
      videoUrl?: string;
      thumbnailUrl?: string;
      audioTitle?: string;
      audioArtist?: string;
      duration?: number;
    };

    if (!body.videoUrl) {
      return json({ error: "videoUrl is required to publish a reel" }, 400);
    }

    const reelId = randomUUID();
    const now = new Date().toISOString();

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO reels (id, user_id, caption, audio_title, audio_artist, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          reelId,
          auth.user.userId,
          body.caption || "",
          body.audioTitle || "Original Audio",
          body.audioArtist || auth.user.username,
          now,
          now,
        ],
      );

      await client.query(
        `INSERT INTO reel_media (id, reel_id, user_id, storage_path, thumbnail_path, duration_seconds, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          randomUUID(),
          reelId,
          auth.user.userId,
          body.videoUrl,
          body.thumbnailUrl || null,
          body.duration || 15.0,
          now,
        ],
      );

      await client.query("UPDATE profiles SET reels_count = reels_count + 1 WHERE id = $1", [
        auth.user.userId,
      ]);
    });

    const res = await dbQuery("SELECT * FROM reels WHERE id = $1", [reelId]);
    if (!res.rows[0]) return json({ error: "Reel creation failed" }, 500);
    const reel = await enrichReel(res.rows[0], auth.user.userId);
    return json({ reel }, 201);
  }

  // DELETE /api/v1/reels/:id (IDOR Protection)
  if (singleReelMatch && method === "DELETE") {
    const reelId = singleReelMatch[1];
    if (!reelId) return json({ error: "Invalid reel ID" }, 400);
    const auth = await requireAuth(request);

    const rRes = await dbQuery<{ user_id: string }>("SELECT user_id FROM reels WHERE id = $1", [
      reelId,
    ]);
    if (rRes.rows.length === 0 || !rRes.rows[0]) {
      return json({ error: "Reel not found" }, 404);
    }
    const targetReel = rRes.rows[0];

    if (targetReel.user_id !== auth.user.userId && auth.user.role !== "super_admin") {
      assertOwnership(targetReel.user_id, auth.user.userId, "reel");
    }

    await withTransaction(async (client) => {
      await client.query("UPDATE reels SET is_deleted = true, deleted_at = now() WHERE id = $1", [
        reelId,
      ]);
      await client.query("UPDATE profiles SET reels_count = reels_count - 1 WHERE id = $1", [
        auth.user.userId,
      ]);
    });

    return json({ success: true, message: "Reel deleted" });
  }

  // POST /api/v1/reels/:id/like
  const reelLikeMatch = pathname.match(/^\/api\/v1\/reels\/([0-9a-f-]{36})\/like$/i);
  if (reelLikeMatch && method === "POST") {
    const reelId = reelLikeMatch[1];
    const auth = await requireAuth(request);

    await dbQuery("UPDATE reels SET likes_count = likes_count + 1 WHERE id = $1", [reelId]);
    return json({ success: true, liked: true });
  }

  // DELETE /api/v1/reels/:id/like
  if (reelLikeMatch && method === "DELETE") {
    const reelId = reelLikeMatch[1];
    const auth = await requireAuth(request);

    await dbQuery("UPDATE reels SET likes_count = likes_count - 1 WHERE id = $1", [reelId]);
    return json({ success: true, liked: false });
  }

  return null;
}

async function enrichReel(reel: Record<string, unknown>, currentUserId: string | null) {
  const reelId = reel["id"] as string;
  const authorId = reel["user_id"] as string;

  const profileRes = await dbQuery<{
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  }>("SELECT username, display_name, avatar_url, is_verified FROM profiles WHERE id = $1", [
    authorId,
  ]);
  const author = profileRes.rows[0] || {
    username: "unknown",
    display_name: "User",
    avatar_url: null,
    is_verified: false,
  };

  const mediaRes = await dbQuery<{
    storage_path: string;
    thumbnail_path: string | null;
    duration_seconds: number;
  }>("SELECT storage_path, thumbnail_path, duration_seconds FROM reel_media WHERE reel_id = $1", [
    reelId,
  ]);

  return {
    ...reel,
    author: {
      id: authorId,
      username: author.username,
      displayName: author.display_name,
      avatarUrl: author.avatar_url,
      isVerified: author.is_verified,
    },
    media: mediaRes.rows[0] || null,
  };
}
