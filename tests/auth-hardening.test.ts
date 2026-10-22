import { test } from "node:test";
import assert from "node:assert/strict";
import { handleAuthApiRequest } from "../src/server/auth-handler";

async function post(path: string, body: unknown): Promise<Response> {
  return handleAuthApiRequest(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

test("OTP request fails closed and never returns a verification code", async () => {
  const response = await post("/api/auth/phone/otp/request", { phone: "+15555550123" });
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal("code" in payload, false);
  assert.match(payload.error, /not configured/i);
});

test("OTP verification cannot mint a session from an unconfigured flow", async () => {
  const response = await post("/api/auth/phone/otp/verify", {
    phone: "+15555550123",
    code: "123456",
  });
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal("token" in payload, false);
});

test("2FA verification does not accept format-only codes", async () => {
  const response = await post("/api/auth/2fa/verify", { userId: "user_maya", token: "123456" });
  assert.equal(response.status, 503);
});

test("password reset does not report success without a verified reset token", async () => {
  const response = await post("/api/auth/reset-password", {
    token: "arbitrary",
    code: "arbitrary",
    newPassword: "Str0ng!Password-Example",
  });
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.notEqual(payload.success, true);
});

test("security audit logs are not returned by the unauthenticated fallback", async () => {
  const response = await handleAuthApiRequest(
    new Request("http://localhost/api/auth/security-logs"),
  );
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal("logs" in payload, false);
});

test("demo feed and stories endpoints do not return seeded identity data", async () => {
  const feed = await handleAuthApiRequest(new Request("http://localhost/api/v1/posts/feed"));
  const stories = await handleAuthApiRequest(new Request("http://localhost/api/v1/stories/tray"));
  assert.equal(feed.status, 503);
  assert.equal(stories.status, 503);
});
