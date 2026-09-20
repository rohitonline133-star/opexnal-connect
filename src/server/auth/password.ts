import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export interface HashResult {
  hash: string;
  salt: string;
}

/**
 * Derives a cryptographic hash of the password using scrypt with a random 32-byte salt.
 */
export function hashPassword(password: string): HashResult {
  const salt = randomBytes(32).toString("hex");
  const derivedKey = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH);
  return {
    hash: derivedKey.toString("hex"),
    salt,
  };
}

/**
 * Constant-time password verification preventing timing attack vectors.
 */
export function verifyPassword(password: string, expectedHash: string, salt: string): boolean {
  try {
    const derivedKey = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH);
    const expectedBuffer = Buffer.from(expectedHash, "hex");
    if (derivedKey.length !== expectedBuffer.length) {
      return false;
    }
    return timingSafeEqual(derivedKey, expectedBuffer);
  } catch {
    return false;
  }
}
