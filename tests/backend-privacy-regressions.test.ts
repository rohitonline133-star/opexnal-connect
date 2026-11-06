import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const server = readFileSync(new URL("../backend/server.js", import.meta.url), "utf8");

test("deactivated accounts cannot create a new login session", () => {
  assert.match(
    server,
    /FROM users WHERE \(username = \$1 OR email = \$1\) AND is_deactivated=FALSE LIMIT 1/,
  );
});

test("follow status does not disclose blocked or deactivated account relationships", () => {
  assert.match(
    server,
    /SELECT id FROM users WHERE id=\$1 AND is_deactivated=FALSE AND NOT EXISTS \(SELECT 1 FROM user_blocks/,
  );
});

test("follow request inbox hides blocked and deactivated requesters", () => {
  assert.match(server, /fr\.status='pending' AND u\.is_deactivated=FALSE/);
  assert.match(
    server,
    /NOT EXISTS \(SELECT 1 FROM user_blocks b WHERE \(b\.blocker_id=\$1 AND b\.blocked_id=u\.id\)/,
  );
});

test("accepting an old follow request rechecks block and deactivation state", () => {
  assert.match(server, /requester\.is_deactivated=FALSE/);
  assert.match(server, /FOR UPDATE OF fr/);
  assert.match(
    server,
    /b\.blocker_id=\$2 AND b\.blocked_id=requester\.id/,
  );
});

test("notification lists and unread counts omit blocked or deactivated actors", () => {
  assert.match(server, /actor\.is_deactivated=FALSE/);
  assert.match(server, /FROM notifications n LEFT JOIN users actor/);
});

test("avatar media authorization observes blocks in either direction", () => {
  assert.match(
    server,
    /avatar_owner\.avatar_url=\$3 AND avatar_owner\.is_deactivated=FALSE AND NOT EXISTS \(SELECT 1 FROM user_blocks/,
  );
});

test("message history excludes deactivated senders", () => {
  assert.match(server, /WHERE m\.conversation_id=\$1 AND u\.is_deactivated=FALSE ORDER BY m\.created_at ASC/);
});
