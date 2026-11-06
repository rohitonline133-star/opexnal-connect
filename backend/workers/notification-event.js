export function notificationFromEvent(event) {
  if (!event || event.event_type !== "notification.requested") {
    throw new Error("Unsupported outbox event type.");
  }
  const payload = event.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Notification event payload must be an object.");
  }
  const { recipientId, actorId = null, notificationType, targetType = null, targetId = null, metadata = {} } = payload;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof recipientId !== "string" || !uuid.test(recipientId)) {
    throw new Error("Notification recipientId must be a UUID.");
  }
  if (actorId !== null && (typeof actorId !== "string" || !uuid.test(actorId))) {
    throw new Error("Notification actorId must be null or a UUID.");
  }
  if (actorId && actorId === recipientId) return null;
  if (typeof notificationType !== "string" || !/^[a-z][a-z0-9_.-]{1,39}$/i.test(notificationType)) {
    throw new Error("Notification type is invalid.");
  }
  if (targetType !== null && (typeof targetType !== "string" || targetType.length > 20)) {
    throw new Error("Notification targetType is invalid.");
  }
  if (targetId !== null && (typeof targetId !== "string" || !uuid.test(targetId))) {
    throw new Error("Notification targetId must be null or a UUID.");
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("Notification metadata must be an object.");
  }
  return { recipientId, actorId, notificationType, targetType, targetId, metadata };
}
