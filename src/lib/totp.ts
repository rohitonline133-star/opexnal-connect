import { generateSecret, generateToken, verifyToken } from "node-2fa";

export function generate2FASecret(accountName: string) {
  const secret = generateSecret({ name: "Opexnal", account: accountName });
  return {
    secret: secret.secret,
    qrCodeUrl: secret.qr,
    uri: secret.uri,
  };
}

export function verify2FAToken(secret: string, token: string) {
  const result = verifyToken(secret, token);
  return result !== null && result.delta === 0;
}
