import jwt, { SignOptions } from "jsonwebtoken";
import { randomBytes, createHmac } from "node:crypto";

const JWT_SECRET =
  process.env["JWT_SECRET"] ||
  (process.env["NODE_ENV"] === "production"
    ? (() => {
        throw new Error(
          "[SECURITY CRITICAL] Mandatory JWT_SECRET is missing in production environment",
        );
      })()
    : "opexnal_default_jwt_secret_change_in_production_key_9281728391");

const SESSION_SECRET =
  process.env["SESSION_SECRET"] ||
  (process.env["NODE_ENV"] === "production"
    ? (() => {
        throw new Error(
          "[SECURITY CRITICAL] Mandatory SESSION_SECRET is missing in production environment",
        );
      })()
    : "opexnal_default_session_secret_key_839218392");

export interface UserTokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  sessionId: string;
}

export function issueAccessToken(
  payload: UserTokenPayload,
  expiresIn: string | number = "7d",
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as never,
    issuer: "opexnal-auth",
    audience: "opexnal-app",
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyAccessToken(token: string): UserTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "opexnal-auth",
      audience: "opexnal-app",
    }) as UserTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Creates a raw cryptographically secure session ID and its SHA-256 HMAC for storage.
 */
export function generateSessionIdentifier(): { rawSessionId: string; hashedToken: string } {
  const rawSessionId = `opx_sess_${randomBytes(24).toString("hex")}`;
  const hashedToken = createHmac("sha256", SESSION_SECRET).update(rawSessionId).digest("hex");
  return { rawSessionId, hashedToken };
}

export interface RefreshTokenPayload {
  sessionId: string;
  userId: string;
  tokenId: string;
  familyId: string;
  rotationCount: number;
}

// Map tracking active and revoked refresh tokens for reuse detection
interface TokenFamilyState {
  currentActiveTokenId: string;
  usedTokenIds: Set<string>;
  revoked: boolean;
}

const tokenFamilies = new Map<string, TokenFamilyState>();

export function issueRefreshToken(params: {
  sessionId: string;
  userId: string;
  familyId?: string;
  rotationCount?: number;
}): { refreshToken: string; tokenId: string; familyId: string } {
  const familyId = params.familyId || `fam_${randomBytes(16).toString("hex")}`;
  const tokenId = `tok_${randomBytes(16).toString("hex")}`;
  const rotationCount = params.rotationCount || 0;

  let familyState = tokenFamilies.get(familyId);
  if (!familyState) {
    familyState = {
      currentActiveTokenId: tokenId,
      usedTokenIds: new Set(),
      revoked: false,
    };
    tokenFamilies.set(familyId, familyState);
  } else {
    familyState.currentActiveTokenId = tokenId;
  }

  const payload: RefreshTokenPayload = {
    sessionId: params.sessionId,
    userId: params.userId,
    tokenId,
    familyId,
    rotationCount,
  };

  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "30d",
    issuer: "opexnal-auth",
    audience: "opexnal-refresh",
  });

  return { refreshToken, tokenId, familyId };
}

export function verifyAndRotateRefreshToken(token: string): {
  success: boolean;
  reused?: boolean;
  message?: string;
  payload?: RefreshTokenPayload;
  newAccessToken?: string;
  newRefreshToken?: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "opexnal-auth",
      audience: "opexnal-refresh",
    }) as RefreshTokenPayload;

    const familyState = tokenFamilies.get(decoded.familyId);
    if (!familyState || familyState.revoked) {
      return { success: false, message: "Token family revoked or expired" };
    }

    // Reuse detection: if this token was ALREADY used, someone replayed an old refresh token!
    if (familyState.usedTokenIds.has(decoded.tokenId)) {
      familyState.revoked = true; // Revoke entire family!
      return {
        success: false,
        reused: true,
        message: "Refresh token reuse detected. Session terminated for security.",
      };
    }

    // Ensure it matches the active token ID
    if (familyState.currentActiveTokenId !== decoded.tokenId) {
      familyState.revoked = true;
      return {
        success: false,
        reused: true,
        message: "Invalid or desynchronized refresh token. Session terminated.",
      };
    }

    // Mark current token as used
    familyState.usedTokenIds.add(decoded.tokenId);

    // Rotate: Issue new refresh token in the same family
    const nextRotation = issueRefreshToken({
      sessionId: decoded.sessionId,
      userId: decoded.userId,
      familyId: decoded.familyId,
      rotationCount: decoded.rotationCount + 1,
    });

    return {
      success: true,
      payload: decoded,
      newRefreshToken: nextRotation.refreshToken,
    };
  } catch {
    return { success: false, message: "Invalid or expired refresh token" };
  }
}

export function revokeTokenFamily(familyId: string): void {
  const familyState = tokenFamilies.get(familyId);
  if (familyState) {
    familyState.revoked = true;
  }
}

export function hashSessionId(rawSessionId: string): string {
  return createHmac("sha256", SESSION_SECRET).update(rawSessionId).digest("hex");
}
