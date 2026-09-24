import { randomUUID } from "node:crypto";
import { dbQuery, withTransaction } from "../../db/index";
import { extractAuth, requireAuth, authorizeCommentDelete } from "../../security/authorizer";
import { publishRealtimeEvent } from "../../realtime/realtime-engine";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleCommentsRoutes(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // GET /api/v1/comments/post/:postId
  const listMatch = pathname.match(/^\/api\/v1\/comments\/post\/([0-9a-f-]{36})$/i);
  if (listMatch && method === "GET") {
    const postId = listMatch[1];
    const auth = await extractAuth(request);
    const currentUserId = auth?.user.userId || null;

    const res = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM comments WHERE post_id = $1 AND is_deleted = false ORDER BY created_at ASC",
      [postId],
    );

    const enriched = await Promise.all(
      res.rows.map(async (c) => {
        const authorRes = await dbQuery<{
          username: string;
          display_name: string;
          avatar_url: string | null;
        }>("SELECT username, display_name, avatar_url FROM profiles WHERE id = $1", [c["user_id"]]);
        const author = authorRes.rows[0] || {
          username: "unknown",
          display_name: "User",
          avatar_url: null,
        };

        let isLiked = false;
        if (currentUserId) {
          const lRes = await dbQuery(
            "SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
            [c["id"], currentUserId],
          );
          isLiked = lRes.rows.length > 0;
        }

        return {
          ...c,
          author: {
            id: c["user_id"],
            username: author.username,
            displayName: author.display_name,
            avatarUrl: author.avatar_url,
          },
          isLiked,
        };
      }),
    );

    return json({ comments: enriched });
  }

  // POST /api/v1/comments (Create comment)
  if (pathname === "/api/v1/comments" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as { postId?: string; text?: string; parentId?: string };

    if (!body.postId || !body.text || body.text.trim().length === 0) {
      return json({ error: "postId and non-empty text are required" }, 400);
    }
    const text = body.text.trim();

    const commentId = randomUUID();
    const now = new Date().toISOString();

    const postRes = await dbQuery<{ user_id: string }>(
      "SELECT user_id FROM posts WHERE id = $1 AND is_deleted = false",
      [body.postId],
    );
    if (postRes.rows.length === 0 || !postRes.rows[0])
      return json({ error: "Post not found" }, 404);

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO comments (id, post_id, user_id, parent_id, text, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [commentId, body.postId, auth.user.userId, body.parentId || null, text, now, now],
      );

      await client.query("UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1", [
        body.postId,
      ]);

      // Notify post author if not self
      const postOwnerId = postRes.rows[0]?.user_id;
      if (postOwnerId && postOwnerId !== auth.user.userId) {
        await client.query(
          `INSERT INTO notifications (id, user_id, actor_id, type, entity_type, entity_id, message, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
          [
            randomUUID(),
            postOwnerId,
            auth.user.userId,
            "comment",
            "post",
            body.postId,
            `@${auth.user.username} commented on your post: "${text.slice(0, 40)}"`,
          ],
        );
        publishRealtimeEvent(`user:${postOwnerId}`, "notification:new", {
          type: "comment",
          postId: body.postId,
          actorUsername: auth.user.username,
        });
      }
    });

    const cRes = await dbQuery("SELECT * FROM comments WHERE id = $1", [commentId]);
    publishRealtimeEvent(`post:${body.postId}`, "comment:new", cRes.rows[0]);

    return json({ comment: cRes.rows[0] }, 201);
  }

  // DELETE /api/v1/comments/:id (IDOR Protection: author or post owner)
  const deleteMatch = pathname.match(/^\/api\/v1\/comments\/([0-9a-f-]{36})$/i);
  if (deleteMatch && method === "DELETE") {
    const commentId = deleteMatch[1];
    if (!commentId) return json({ error: "Invalid comment ID" }, 400);
    const auth = await requireAuth(request);

    const allowed = await authorizeCommentDelete(commentId, auth.user.userId);
    if (!allowed && auth.user.role !== "super_admin") {
      return json({ error: "Forbidden: You cannot delete this comment" }, 403);
    }

    const cRes = await dbQuery<{ post_id: string }>("SELECT post_id FROM comments WHERE id = $1", [
      commentId,
    ]);
    const postId = cRes.rows[0]?.post_id;

    await withTransaction(async (client) => {
      await client.query("DELETE FROM comments WHERE id = $1", [commentId]);
      if (postId) {
        await client.query("UPDATE posts SET comments_count = comments_count - 1 WHERE id = $1", [
          postId,
        ]);
      }
    });

    return json({ success: true, message: "Comment deleted" });
  }

  // POST /api/v1/comments/:id/like
  const likeMatch = pathname.match(/^\/api\/v1\/comments\/([0-9a-f-]{36})\/like$/i);
  if (likeMatch && method === "POST") {
    const commentId = likeMatch[1];
    const auth = await requireAuth(request);

    const existing = await dbQuery(
      "SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, auth.user.userId],
    );

    if (existing.rows.length === 0) {
      await withTransaction(async (client) => {
        await client.query(
          "INSERT INTO comment_likes (id, comment_id, user_id, created_at) VALUES ($1, $2, $3, now())",
          [randomUUID(), commentId, auth.user.userId],
        );
        await client.query("UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1", [
          commentId,
        ]);
      });
    }

    return json({ success: true, liked: true });
  }

  // DELETE /api/v1/comments/:id/like
  if (likeMatch && method === "DELETE") {
    const commentId = likeMatch[1];
    const auth = await requireAuth(request);

    await withTransaction(async (client) => {
      const res = await client.query(
        "DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
        [commentId, auth.user.userId],
      );
      if (res.rowCount > 0) {
        await client.query("UPDATE comments SET likes_count = likes_count - 1 WHERE id = $1", [
          commentId,
        ]);
      }
    });

    return json({ success: true, liked: false });
  }

  return null;
}
