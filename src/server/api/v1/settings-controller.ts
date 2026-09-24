import { dbQuery } from "../../db/index";
import { requireAuth } from "../../security/authorizer";
import { logoutSession, revokeOtherSessions } from "../../auth/auth-service";
import { triggerEmergencyContainment } from "../../security/session-manager";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleSettingsAndSecurityRoutes(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // GET /api/v1/settings
  if (pathname === "/api/v1/settings" && method === "GET") {
    const auth = await requireAuth(request);
    const res = await dbQuery<{ settings_json: unknown }>(
      "SELECT settings_json FROM settings WHERE user_id = $1",
      [auth.user.userId],
    );

    const settingsData = res.rows[0]?.settings_json || {
      notifications: true,
      darkMode: false,
      privateAccount: false,
      language: "en",
    };

    return json({ settings: settingsData });
  }

  // PUT /api/v1/settings
  if (pathname === "/api/v1/settings" && method === "PUT") {
    const auth = await requireAuth(request);
    const body = await request.json();

    await dbQuery(
      `INSERT INTO settings (user_id, settings_json, created_at, updated_at)
       VALUES ($1, $2, now(), now())
       ON CONFLICT (user_id) DO UPDATE SET settings_json = $2, updated_at = now()`,
      [auth.user.userId, JSON.stringify(body)],
    );

    return json({ success: true, settings: body });
  }

  // GET /api/v1/security/sessions (List active sessions)
  if (pathname === "/api/v1/security/sessions" && method === "GET") {
    const auth = await requireAuth(request);
    const res = await dbQuery<Record<string, unknown>>(
      "SELECT id, device, browser, os, ip_address, is_active, last_active_at, created_at FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY last_active_at DESC",
      [auth.user.userId],
    );

    const sessions = res.rows.map((s) => ({
      ...s,
      isCurrent: s["id"] === auth.sessionId,
    }));

    return json({ sessions });
  }

  // DELETE /api/v1/security/sessions/:sessionId (Revoke specific session)
  const revokeMatch = pathname.match(/^\/api\/v1\/security\/sessions\/([^/]+)$/);
  if (revokeMatch && method === "DELETE") {
    const targetSessionId = revokeMatch[1];
    if (!targetSessionId) return json({ error: "Session ID required" }, 400);
    const auth = await requireAuth(request);

    // Verify ownership of the session being revoked
    const sRes = await dbQuery<{ user_id: string }>("SELECT user_id FROM sessions WHERE id = $1", [
      targetSessionId,
    ]);

    if (sRes.rows.length === 0 || !sRes.rows[0] || sRes.rows[0].user_id !== auth.user.userId) {
      return json({ error: "Session not found or access denied" }, 403);
    }

    await logoutSession(targetSessionId);
    return json({ success: true, message: "Session revoked" });
  }

  // POST /api/v1/security/sessions/revoke-others
  if (pathname === "/api/v1/security/sessions/revoke-others" && method === "POST") {
    const auth = await requireAuth(request);
    const count = await revokeOtherSessions(auth.user.userId, auth.sessionId);
    return json({ success: true, revokedCount: count });
  }

  // POST /api/v1/security/containment (Emergency Account Containment)
  if (pathname === "/api/v1/security/containment" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json().catch(() => ({}))) as { reason?: string };

    triggerEmergencyContainment({
      userId: auth.user.userId,
      reason: body.reason || "User-initiated emergency lock",
      severity: "CRITICAL",
    });

    await dbQuery("UPDATE users SET status = 'quarantined' WHERE id = $1", [auth.user.userId]);

    return json({
      success: true,
      message: "Emergency account containment activated. All sessions have been terminated.",
    });
  }

  // GET /api/v1/security/audit-logs
  if (pathname === "/api/v1/security/audit-logs" && method === "GET") {
    const auth = await requireAuth(request);
    const res = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [auth.user.userId],
    );
    return json({ logs: res.rows });
  }

  // GET /api/v1/notifications
  if (pathname === "/api/v1/notifications" && method === "GET") {
    const auth = await requireAuth(request);
    const res = await dbQuery<Record<string, unknown>>(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [auth.user.userId],
    );
    return json({ notifications: res.rows });
  }

  // POST /api/v1/notifications/read-all
  if (pathname === "/api/v1/notifications/read-all" && method === "POST") {
    const auth = await requireAuth(request);
    await dbQuery("UPDATE notifications SET is_read = true WHERE user_id = $1", [auth.user.userId]);
    return json({ success: true });
  }

  return null;
}
