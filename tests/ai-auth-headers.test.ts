import { test } from "node:test";
import assert from "node:assert/strict";
import { createFirstPartyAuthHeaders } from "../src/server/ai/auth-headers.ts";

test("forwards a bearer credential for legacy clients", () => {
  const request = new Request("https://app.example/api/ai/chat", {
    headers: { Authorization: "Bearer legacy-token" },
  });
  const headers = createFirstPartyAuthHeaders(request);
  assert.equal(headers?.get("authorization"), "Bearer legacy-token");
  assert.equal(headers?.get("cookie"), null);
});

test("forwards only the Opexnal HttpOnly session cookie and its CSRF context", () => {
  const request = new Request("https://app.example/api/ai/chat", {
    headers: {
      Cookie: "theme=dark; opexnal_session=header.payload.signature; tracking=abc",
      Origin: "https://app.example",
      "Sec-Fetch-Site": "same-origin",
    },
  });
  const headers = createFirstPartyAuthHeaders(request);
  assert.equal(headers?.get("cookie"), "opexnal_session=header.payload.signature");
  assert.equal(headers?.get("origin"), "https://app.example");
  assert.equal(headers?.get("sec-fetch-site"), "same-origin");
  assert.equal(headers?.has("authorization"), false);
});

test("rejects absent or malformed credentials and does not forward unrelated cookies", () => {
  assert.equal(createFirstPartyAuthHeaders(new Request("https://app.example")), null);
  const malformed = new Request("https://app.example", {
    headers: { Cookie: "theme=dark; opexnal_session=not-a-jwt" },
  });
  assert.equal(createFirstPartyAuthHeaders(malformed), null);
});
