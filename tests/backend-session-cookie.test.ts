import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseSessionCookie,
  createSessionCookie,
  createClearedSessionCookie,
  isAllowedCookieRequest,
} from "../backend/session-cookie.js";

const token = "header.payload.signature";

test("session cookie is HttpOnly, SameSite=Lax, scoped to root and Secure in production", () => {
  const cookie = createSessionCookie(token, { secure: true });
  assert.match(cookie, /^opexnal_session=/);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /; SameSite=Lax/);
  assert.match(cookie, /; Path=\//);
  assert.match(cookie, /; Max-Age=3600/);
});

test("session cookie parser extracts only a valid compact token", () => {
  assert.equal(parseSessionCookie("other=value; opexnal_session=header.payload.signature"), token);
  assert.equal(parseSessionCookie("opexnal_session=not-a-jwt"), "");
  assert.equal(parseSessionCookie("opexnal_session=header.payload.signature; x=y"), token);
  assert.equal(parseSessionCookie(""), "");
  assert.equal(parseSessionCookie("x".repeat(9000)), "");
});

test("session cookie clearing uses matching attributes and immediate expiry", () => {
  const cookie = createClearedSessionCookie({ secure: true });
  assert.match(cookie, /^opexnal_session=/);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /; SameSite=Lax/);
  assert.match(cookie, /; Path=\//);
  assert.match(cookie, /; Max-Age=0/);
});

test("cookie-authenticated unsafe requests require an exact trusted Origin", () => {
  const origins = ["https://opexnal-connect.vercel.app"];
  assert.equal(isAllowedCookieRequest(origins[0], "same-origin", origins), true);
  assert.equal(isAllowedCookieRequest("https://attacker.example", "same-site", origins), false);
  assert.equal(isAllowedCookieRequest(undefined, "same-origin", origins), false);
  assert.equal(isAllowedCookieRequest(origins[0], "cross-site", origins), false);
});
