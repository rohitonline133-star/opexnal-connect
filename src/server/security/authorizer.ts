import { validateUserSession } from "../auth/auth-service";
import { UserTokenPayload } from "../auth/tokens";
import { dbQuery } from "../db/index";

export interface AuthContext {
  user: UserTokenPayload;
  sessionId: string;
}

export class AuthorizationError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = statusCode;
  }
}

/**
 * Extracts authentication token from Authorization header or Cookie header.
 */
export async function extractAuth(request: Request): Promise<AuthContext | null> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  let token: string | null = null;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    // Check cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/opexnal_token=([^;]+)/);
    if (match && match[1]) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token) return null;

  const result = await validateUserSession(token);
  if (!result.valid || !result.user || !result.sessionId) {
    return null;
  }

  return {
    user: result.user,
    sessionId: result.sessionId,
  };
}

/**
 * Enforces authenticated session. Throws 401 AuthorizationError if unauthenticated.
 */
export async function requireAuth(request: Request): Promise<AuthContext> {
  const auth = await extractAuth(request);
  if (!auth) {
    throw new AuthorizationError("Authentication required to access this resource", 401);
  }
  return auth;
}

/**
 * Strict IDOR / BOLA Prevention: Asserts that currentUserId is the owner of the resource.
 */
export function assertOwnership(
  resourceOwnerId: string,
  currentUserId: string,
  resourceName: string,
): void {
  if (resourceOwnerId !== currentUserId) {
    throw new AuthorizationError(
      `Access denied: You do not have permission to modify or delete this ${resourceName}`,
      403,
    );
  }
}

/**
 * Authorizes access to a post, checking deleted status, privacy, and blocks.
 */
export async function authorizePostAccess(
  postId: string,
  currentUserId: string | null,
): Promise<{
  allowed: boolean;
  reason?: string | undefined;
  post?: Record<string, unknown> | undefined;
}> {
  const res = await dbQuery<Record<string, unknown>>(
    "SELECT * FROM posts WHERE id = $1 AND is_deleted = false",
    [postId],
  );
  if (res.rows.length === 0 || !res.rows[0]) {
    return { allowed: false, reason: "Post not found or has been deleted" };
  }
  const post = res.rows[0];
  const authorId = post["user_id"] as string;

  // Author can always see own post
  if (currentUserId && authorId === currentUserId) {
    return { allowed: true, post };
  }

  // Check if blocked
  if (currentUserId) {
    const blockCheck = await dbQuery(
      "SELECT id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)",
      [authorId, currentUserId],
    );
    if (blockCheck.rows.length > 0) {
      return { allowed: false, reason: "Post unavailable" };
    }
  }

  // Check visibility rules
  const visibility = (post["visibility"] as string) || "public";
  if (visibility === "public") {
    return { allowed: true, post };
  }

  if (!currentUserId) {
    return { allowed: false, reason: "Private content requires authentication" };
  }

  // Check if following for private/followers post
  const followCheck = await dbQuery(
    "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
    [currentUserId, authorId],
  );
  if (followCheck.rows.length === 0) {
    return { allowed: false, reason: "This account is private. Follow to see posts." };
  }

  return { allowed: true, post };
}

/**
 * Authorizes access to a direct/group conversation.
 * IDOR Prevention: Users cannot read or send messages in conversations they do not belong to.
 */
export async function authorizeConversationAccess(
  conversationId: string,
  currentUserId: string,
): Promise<{ allowed: boolean; membership?: Record<string, unknown> | undefined }> {
  const memberRes = await dbQuery(
    "SELECT * FROM conversation_members WHERE conversation_id = $1 AND user_id = $2",
    [conversationId, currentUserId],
  );
  if (memberRes.rows.length === 0 || !memberRes.rows[0]) {
    return { allowed: false };
  }
  return { allowed: true, membership: memberRes.rows[0] };
}

/**
 * Authorizes deletion of a comment: allowed if user wrote the comment OR owns the post.
 */
export async function authorizeCommentDelete(
  commentId: string,
  currentUserId: string,
): Promise<boolean> {
  const cRes = await dbQuery<{ user_id: string; post_id: string }>(
    "SELECT user_id, post_id FROM comments WHERE id = $1",
    [commentId],
  );
  if (cRes.rows.length === 0 || !cRes.rows[0]) return false;
  const comment = cRes.rows[0];

  // Comment author can delete
  if (comment.user_id === currentUserId) return true;

  // Post owner can delete comments on their own post
  const pRes = await dbQuery<{ user_id: string }>("SELECT user_id FROM posts WHERE id = $1", [
    comment.post_id,
  ]);
  if (pRes.rows.length > 0 && pRes.rows[0] && pRes.rows[0].user_id === currentUserId) {
    return true;
  }

  return false;
}
