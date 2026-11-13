import assert from "node:assert/strict";
import test from "node:test";
import { notificationFromEvent } from "../backend/workers/notification-event.js";

const recipientId = "123e4567-e89b-42d3-a456-426614174000";
const actorId = "123e4567-e89b-42d3-a456-426614174001";

test("accepts a well-formed notification event", () => {
  assert.deepEqual(
    notificationFromEvent({
      event_type: "notification.requested",
      payload: { recipientId, actorId, notificationType: "post.like", metadata: { postId: "safe-id" } },
    }),
    { recipientId, actorId, notificationType: "post.like", targetType: null, targetId: null, metadata: { postId: "safe-id" } },
  );
});

test("skips self-notifications", () => {
  assert.equal(
    notificationFromEvent({
      event_type: "notification.requested",
      payload: { recipientId, actorId: recipientId, notificationType: "post.like" },
    }),
    null,
  );
});

test("rejects malformed recipient identifiers", () => {
  assert.throws(
    () => notificationFromEvent({
      event_type: "notification.requested",
      payload: { recipientId: "not-a-uuid", notificationType: "post.like" },
    }),
    /recipientId must be a UUID/,
  );
});

test("rejects unknown event types and unsafe metadata shapes", () => {
  assert.throws(() => notificationFromEvent({ event_type: "unknown", payload: {} }), /Unsupported/);
  assert.throws(
    () => notificationFromEvent({
      event_type: "notification.requested",
      payload: { recipientId, notificationType: "post.like", metadata: [] },
    }),
    /metadata must be an object/,
  );
});
