import { randomUUID } from "node:crypto";
import { dbQuery, withTransaction } from "../../db/index";
import { requireAuth, authorizeConversationAccess } from "../../security/authorizer";
import { publishRealtimeEvent } from "../../realtime/realtime-engine";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleMessagesRoutes(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // GET /api/v1/messages/conversations
  if (pathname === "/api/v1/messages/conversations" && method === "GET") {
    const auth = await requireAuth(request);

    // Get all conversations user is a member of
    const memberRes = await dbQuery<{ conversation_id: string }>(
      "SELECT conversation_id FROM conversation_members WHERE user_id = $1",
      [auth.user.userId],
    );

    const conversations = await Promise.all(
      memberRes.rows.map(async (m) => {
        const cRes = await dbQuery<Record<string, unknown>>(
          "SELECT * FROM conversations WHERE id = $1",
          [m.conversation_id],
        );
        const conv = cRes.rows[0];
        if (!conv) return null;

        // Get members
        const otherMembersRes = await dbQuery<{ user_id: string }>(
          "SELECT user_id FROM conversation_members WHERE conversation_id = $1 AND user_id != $2",
          [m.conversation_id, auth.user.userId],
        );

        let otherUserProfile = null;
        const otherMember = otherMembersRes.rows[0];
        if (otherMember) {
          const pRes = await dbQuery<{
            username: string;
            display_name: string;
            avatar_url: string | null;
          }>("SELECT username, display_name, avatar_url FROM profiles WHERE id = $1", [
            otherMember.user_id,
          ]);
          otherUserProfile = {
            id: otherMember.user_id,
            ...(pRes.rows[0] || {}),
          };
        }

        // Get last message
        const lastMsgRes = await dbQuery<Record<string, unknown>>(
          "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1",
          [m.conversation_id],
        );

        return {
          ...conv,
          participant: otherUserProfile,
          lastMessage: lastMsgRes.rows[0] || null,
        };
      }),
    );

    const validConvs = conversations.filter((c): c is NonNullable<typeof c> => Boolean(c));
    validConvs.sort((a, b) => {
      const aTime = (a as Record<string, unknown>)["last_message_at"] || 0;
      const bTime = (b as Record<string, unknown>)["last_message_at"] || 0;
      const ta = new Date(aTime as string).getTime();
      const tb = new Date(bTime as string).getTime();
      return tb - ta;
    });

    return json({ conversations: validConvs });
  }

  // POST /api/v1/messages/conversations (Create or get existing direct conversation)
  if (pathname === "/api/v1/messages/conversations" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as { recipientId?: string; title?: string };

    if (!body.recipientId) {
      return json({ error: "recipientId is required" }, 400);
    }

    if (body.recipientId === auth.user.userId) {
      return json({ error: "Cannot create conversation with yourself" }, 400);
    }

    // Check if direct conversation already exists between these 2 users
    const myConvs = await dbQuery<{ conversation_id: string }>(
      "SELECT conversation_id FROM conversation_members WHERE user_id = $1",
      [auth.user.userId],
    );

    let existingConvId: string | null = null;
    for (const c of myConvs.rows) {
      const match = await dbQuery(
        "SELECT id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2",
        [c.conversation_id, body.recipientId],
      );
      if (match.rows.length > 0) {
        existingConvId = c.conversation_id;
        break;
      }
    }

    if (existingConvId) {
      const cRes = await dbQuery("SELECT * FROM conversations WHERE id = $1", [existingConvId]);
      return json({ conversation: cRes.rows[0] });
    }

    // Create new conversation
    const convId = randomUUID();
    const now = new Date().toISOString();

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO conversations (id, type, title, created_by, last_message_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [convId, "direct", body.title || null, auth.user.userId, now, now, now],
      );

      await client.query(
        "INSERT INTO conversation_members (id, conversation_id, user_id, role, joined_at) VALUES ($1, $2, $3, $4, $5)",
        [randomUUID(), convId, auth.user.userId, "owner", now],
      );

      await client.query(
        "INSERT INTO conversation_members (id, conversation_id, user_id, role, joined_at) VALUES ($1, $2, $3, $4, $5)",
        [randomUUID(), convId, body.recipientId, "member", now],
      );
    });

    const created = await dbQuery("SELECT * FROM conversations WHERE id = $1", [convId]);
    return json({ conversation: created.rows[0] }, 201);
  }

  // GET /api/v1/messages/conversation/:id (IDOR verification: User MUST be member)
  const convIdMatch = pathname.match(/^\/api\/v1\/messages\/conversation\/([0-9a-f-]{36})$/i);
  if (convIdMatch && method === "GET") {
    const convId = convIdMatch[1];
    if (!convId) return json({ error: "Invalid conversation ID" }, 400);
    const auth = await requireAuth(request);

    // IDOR Protection: verify user is in conversation
    const authCheck = await authorizeConversationAccess(convId, auth.user.userId);
    if (!authCheck.allowed && auth.user.role !== "super_admin") {
      return json({ error: "Access Denied: You are not a member of this conversation" }, 403);
    }

    const messagesRes = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM messages WHERE conversation_id = $1 AND is_deleted = false ORDER BY created_at ASC LIMIT 100",
      [convId],
    );

    return json({ messages: messagesRes.rows });
  }

  // POST /api/v1/messages/send (Send message)
  if (pathname === "/api/v1/messages/send" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as {
      conversationId?: string;
      body?: string;
      mediaUrl?: string;
      mediaType?: string;
    };

    if (!body.conversationId || (!body.body && !body.mediaUrl)) {
      return json({ error: "conversationId and message body or media are required" }, 400);
    }

    // IDOR Check
    const authCheck = await authorizeConversationAccess(body.conversationId, auth.user.userId);
    if (!authCheck.allowed && auth.user.role !== "super_admin") {
      return json({ error: "Forbidden: You are not a member of this conversation" }, 403);
    }

    const messageId = randomUUID();
    const now = new Date().toISOString();

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO messages (id, conversation_id, sender_id, body, media_url, media_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          messageId,
          body.conversationId,
          auth.user.userId,
          body.body || "",
          body.mediaUrl || null,
          body.mediaType || null,
          now,
          now,
        ],
      );

      await client.query("UPDATE conversations SET last_message_at = $1 WHERE id = $2", [
        now,
        body.conversationId,
      ]);
    });

    const mRes = await dbQuery("SELECT * FROM messages WHERE id = $1", [messageId]);
    const message = mRes.rows[0];

    // Realtime broadcast to conversation channel
    publishRealtimeEvent(`conversation:${body.conversationId}`, "message:new", message);

    return json({ message }, 201);
  }

  // POST /api/v1/messages/read
  if (pathname === "/api/v1/messages/read" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as { conversationId?: string };

    if (!body.conversationId) return json({ error: "conversationId required" }, 400);

    await dbQuery(
      "UPDATE conversation_members SET last_read_at = now() WHERE conversation_id = $1 AND user_id = $2",
      [body.conversationId, auth.user.userId],
    );

    publishRealtimeEvent(`conversation:${body.conversationId}`, "message:read", {
      userId: auth.user.userId,
      conversationId: body.conversationId,
    });

    return json({ success: true });
  }

  return null;
}
