import { randomUUID } from "node:crypto";
import { dbQuery, withTransaction } from "../../db/index";
import {
  extractAuth,
  requireAuth,
  assertOwnership,
  authorizePostAccess,
} from "../../security/authorizer";
import { publishRealtimeEvent } from "../../realtime/realtime-engine";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handlePostsRoutes(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // GET /api/v1/posts/feed
  if (pathname === "/api/v1/posts/feed" && method === "GET") {
    const auth = await extractAuth(request);
    const currentUserId = auth?.user.userId || null;

    const postsRes = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM posts WHERE is_deleted = false ORDER BY created_at DESC LIMIT 30",
    );

    const enrichedPosts = await Promise.all(
      postsRes.rows.map((post) => enrichPost(post, currentUserId)),
    );

    return json({ posts: enrichedPosts });
  }

  // GET /api/v1/posts/explore
  if (pathname === "/api/v1/posts/explore" && method === "GET") {
    const auth = await extractAuth(request);
    const currentUserId = auth?.user.userId || null;

    const postsRes = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM posts WHERE is_deleted = false AND visibility = 'public' ORDER BY created_at DESC LIMIT 40",
    );

    const enrichedPosts = await Promise.all(
      postsRes.rows.map((post) => enrichPost(post, currentUserId)),
    );

    return json({ posts: enrichedPosts });
  }

  // GET /api/v1/posts/user/:userId
  const userPostsMatch = pathname.match(/^\/api\/v1\/posts\/user\/([^/]+)$/);
  if (userPostsMatch && method === "GET") {
    const targetUserId = userPostsMatch[1];
    const auth = await extractAuth(request);
    const currentUserId = auth?.user.userId || null;

    const postsRes = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM posts WHERE user_id = $1 AND is_deleted = false ORDER BY created_at DESC",
      [targetUserId],
    );

    const enrichedPosts = await Promise.all(
      postsRes.rows.map((post) => enrichPost(post, currentUserId)),
    );

    return json({ posts: enrichedPosts });
  }

  // GET /api/v1/posts/:id
  const singlePostMatch = pathname.match(/^\/api\/v1\/posts\/([0-9a-f-]{36})$/i);
  if (singlePostMatch && method === "GET") {
    const postId = singlePostMatch[1];
    const auth = await extractAuth(request);
    const currentUserId = auth?.user.userId || null;

    const check = await authorizePostAccess(postId, currentUserId);
    if (!check.allowed || !check.post) {
      return json({ error: check.reason || "Forbidden" }, 403);
    }

    const post = await enrichPost(check.post, currentUserId);
    return json({ post });
  }

  // POST /api/v1/posts (Create post)
  if (pathname === "/api/v1/posts" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as {
      caption?: string;
      mediaUrls?: string[];
      locationName?: string;
      visibility?: string;
    };

    if (!body.mediaUrls || body.mediaUrls.length === 0) {
      return json({ error: "At least one media item is required to create a post" }, 400);
    }

    const postId = randomUUID();
    const now = new Date().toISOString();
    const caption = body.caption || "";

    await withTransaction(async (client) => {
      // 1. Insert post record
      await client.query(
        `INSERT INTO posts (id, user_id, caption, location_name, visibility, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          postId,
          auth.user.userId,
          caption,
          body.locationName || null,
          body.visibility || "public",
          now,
          now,
        ],
      );

      // 2. Insert media items
      for (let i = 0; i < body.mediaUrls.length; i++) {
        const url = body.mediaUrls[i];
        const isVideo = url.endsWith(".mp4") || url.endsWith(".mov") || url.includes("video");
        await client.query(
          `INSERT INTO post_media (id, post_id, user_id, storage_path, media_type, position, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [randomUUID(), postId, auth.user.userId, url, isVideo ? "video" : "image", i, now],
        );
      }

      // 3. Increment user's posts_count
      await client.query("UPDATE profiles SET posts_count = posts_count + 1 WHERE id = $1", [
        auth.user.userId,
      ]);

      // 4. Parse and link hashtags
      const hashtags = caption.match(/#[a-z0-9_]+/gi) || [];
      for (const tag of hashtags) {
        const cleanTag = tag.slice(1).toLowerCase();
        await client.query(
          `INSERT INTO hashtags (id, name, post_count, created_at)
           VALUES ($1, $2, 1, $3)`,
          [randomUUID(), cleanTag, now],
        );
      }
    });

    const createdPostRes = await dbQuery("SELECT * FROM posts WHERE id = $1", [postId]);
    const post = await enrichPost(createdPostRes.rows[0], auth.user.userId);

    publishRealtimeEvent("feed", "post:created", { postId, userId: auth.user.userId });
    return json({ post }, 201);
  }

  // DELETE /api/v1/posts/:id (IDOR verification)
  if (singlePostMatch && method === "DELETE") {
    const postId = singlePostMatch[1];
    const auth = await requireAuth(request);

    const postRes = await dbQuery<{ user_id: string }>("SELECT user_id FROM posts WHERE id = $1", [
      postId,
    ]);
    if (postRes.rows.length === 0) {
      return json({ error: "Post not found" }, 404);
    }

    // IDOR Protection: verify that requesting user owns this post or is super_admin
    if (postRes.rows[0].user_id !== auth.user.userId && auth.user.role !== "super_admin") {
      assertOwnership(postRes.rows[0].user_id, auth.user.userId, "post");
    }

    await withTransaction(async (client) => {
      await client.query("UPDATE posts SET is_deleted = true, deleted_at = now() WHERE id = $1", [
        postId,
      ]);
      await client.query("UPDATE profiles SET posts_count = posts_count - 1 WHERE id = $1", [
        auth.user.userId,
      ]);
    });

    return json({ success: true, message: "Post deleted successfully" });
  }

  // POST /api/v1/posts/:id/like
  const likeMatch = pathname.match(/^\/api\/v1\/posts\/([0-9a-f-]{36})\/like$/i);
  if (likeMatch && method === "POST") {
    const postId = likeMatch[1];
    const auth = await requireAuth(request);

    // Check post exists
    const pCheck = await dbQuery<{ user_id: string }>(
      "SELECT user_id FROM posts WHERE id = $1 AND is_deleted = false",
      [postId],
    );
    if (pCheck.rows.length === 0) return json({ error: "Post not found" }, 404);

    const existing = await dbQuery("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [
      auth.user.userId,
      postId,
    ]);

    if (existing.rows.length === 0) {
      await withTransaction(async (client) => {
        await client.query(
          "INSERT INTO likes (id, user_id, post_id, created_at) VALUES ($1, $2, $3, now())",
          [randomUUID(), auth.user.userId, postId],
        );
        await client.query("UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1", [
          postId,
        ]);

        // Notify post owner if not self
        const ownerId = pCheck.rows[0].user_id;
        if (ownerId !== auth.user.userId) {
          await client.query(
            `INSERT INTO notifications (id, user_id, actor_id, type, entity_type, entity_id, message, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
            [
              randomUUID(),
              ownerId,
              auth.user.userId,
              "like",
              "post",
              postId,
              `@${auth.user.username} liked your post.`,
            ],
          );
          publishRealtimeEvent(`user:${ownerId}`, "notification:new", {
            type: "like",
            postId,
            actorUsername: auth.user.username,
          });
        }
      });
    }

    return json({ success: true, liked: true });
  }

  // DELETE /api/v1/posts/:id/like (Unlike)
  if (likeMatch && method === "DELETE") {
    const postId = likeMatch[1];
    const auth = await requireAuth(request);

    await withTransaction(async (client) => {
      const res = await client.query("DELETE FROM likes WHERE user_id = $1 AND post_id = $2", [
        auth.user.userId,
        postId,
      ]);
      if (res.rowCount > 0) {
        await client.query("UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1", [
          postId,
        ]);
      }
    });

    return json({ success: true, liked: false });
  }

  // POST /api/v1/posts/:id/save
  const saveMatch = pathname.match(/^\/api\/v1\/posts\/([0-9a-f-]{36})\/save$/i);
  if (saveMatch && method === "POST") {
    const postId = saveMatch[1];
    const auth = await requireAuth(request);

    const existing = await dbQuery("SELECT id FROM saves WHERE user_id = $1 AND post_id = $2", [
      auth.user.userId,
      postId,
    ]);

    if (existing.rows.length === 0) {
      await withTransaction(async (client) => {
        await client.query(
          "INSERT INTO saves (id, user_id, post_id, created_at) VALUES ($1, $2, $3, now())",
          [randomUUID(), auth.user.userId, postId],
        );
        await client.query("UPDATE posts SET saves_count = saves_count + 1 WHERE id = $1", [
          postId,
        ]);
      });
    }

    return json({ success: true, saved: true });
  }

  // DELETE /api/v1/posts/:id/save (Unsave)
  if (saveMatch && method === "DELETE") {
    const postId = saveMatch[1];
    const auth = await requireAuth(request);

    await withTransaction(async (client) => {
      const res = await client.query("DELETE FROM saves WHERE user_id = $1 AND post_id = $2", [
        auth.user.userId,
        postId,
      ]);
      if (res.rowCount > 0) {
        await client.query("UPDATE posts SET saves_count = saves_count - 1 WHERE id = $1", [
          postId,
        ]);
      }
    });

    return json({ success: true, saved: false });
  }

  return null;
}

async function enrichPost(post: Record<string, unknown>, currentUserId: string | null) {
  const postId = post["id"] as string;
  const authorId = post["user_id"] as string;

  // Author profile
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

  // Media items
  const mediaRes = await dbQuery<Record<string, unknown>>(
    "SELECT * FROM post_media WHERE post_id = $1 ORDER BY position ASC",
    [postId],
  );

  // User interactions
  let isLiked = false;
  let isSaved = false;

  if (currentUserId) {
    const likeRes = await dbQuery("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [
      currentUserId,
      postId,
    ]);
    isLiked = likeRes.rows.length > 0;

    const saveRes = await dbQuery("SELECT id FROM saves WHERE user_id = $1 AND post_id = $2", [
      currentUserId,
      postId,
    ]);
    isSaved = saveRes.rows.length > 0;
  }

  return {
    ...post,
    author: {
      id: authorId,
      username: author.username,
      displayName: author.display_name,
      avatarUrl: author.avatar_url,
      isVerified: author.is_verified,
    },
    media: mediaRes.rows.map((m) => ({
      id: m["id"],
      url: m["storage_path"],
      mediaType: m["media_type"],
      position: m["position"],
    })),
    isLiked,
    isSaved,
  };
}
