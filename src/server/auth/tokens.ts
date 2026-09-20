import jwt, { SignOptions } from "jsonwebtoken";
import { randomBytes, createHmac } from "node:crypto";

const JWT_SECRET =
  process.env["JWT_SECRET"] || "opexnal_default_jwt_secret_change_in_production_key_9281728391";
const SESSION_SECRET =
  process.env["SESSION_SECRET"] || "opexnal_default_session_secret_key_839218392";

export interface UserTokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  sessionId: string;
}

export function issueAccessToken(payload: UserTokenPayload, expiresIn = "7d"): string {
  const options: SignOptions = {
    expiresIn: expiresIn as unknown as SignOptions["expiresIn"],
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

export function hashSessionId(rawSessionId: string): string {
  return createHmac("sha256", SESSION_SECRET).update(rawSessionId).digest("hex");
}
