import type { VerificationApplication, VerificationStatus } from "../lib/verification";

// Server-side in-memory registry for verification applications with fallback
const serverApplications = new Map<string, VerificationApplication>();

export async function handleVerificationRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/verification/status") {
    const userId = url.searchParams.get("userId") || "guest_user";
    const app = serverApplications.get(userId) || null;
    return new Response(
      JSON.stringify({
        status: app ? app.status : ("NOT_APPLIED" as VerificationStatus),
        application: app,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  if (request.method === "POST" && url.pathname === "/api/verification/apply") {
    try {
      const body = (await request.json()) as Partial<VerificationApplication>;
      if (!body.userId || !body.fullName || !body.category || !body.documentType) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: fullName, category, and documentType are required.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const application: VerificationApplication = {
        id: `verif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: body.userId,
        username: body.username || "creator",
        fullName: body.fullName.trim(),
        knownAs: body.knownAs?.trim() || body.fullName.trim(),
        category: body.category,
        documentType: body.documentType,
        documentNumber: body.documentNumber?.trim() || "DOC-ON-FILE",
        officialLinks: Array.isArray(body.officialLinks) ? body.officialLinks.filter(Boolean) : [],
        notes: body.notes?.trim() || "",
        status: "PENDING",
        appliedAt: new Date().toISOString(),
        reviewedAt: null,
        rejectionReason: null,
      };

      serverApplications.set(body.userId, application);

      return new Response(
        JSON.stringify({
          success: true,
          application,
          message: "Verification application submitted to Trust & Safety queue.",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (request.method === "POST" && url.pathname === "/api/verification/admin-review") {
    try {
      const body = (await request.json()) as {
        userId: string;
        action: "start_review" | "approve" | "reject";
        rejectionReason?: string;
        reviewerNotes?: string;
      };

      if (!body.userId || !body.action) {
        return new Response(JSON.stringify({ error: "userId and action are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const app = serverApplications.get(body.userId);
      if (!app) {
        return new Response(JSON.stringify({ error: "Application not found for user" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (body.action === "start_review") {
        app.status = "IN_REVIEW";
      } else if (body.action === "approve") {
        app.status = "APPROVED";
        app.reviewedAt = new Date().toISOString();
        app.reviewerNotes = body.reviewerNotes || "Meets all public figure/creator criteria.";
      } else if (body.action === "reject") {
        app.status = "REJECTED";
        app.reviewedAt = new Date().toISOString();
        app.rejectionReason =
          body.rejectionReason || "Documentation did not satisfy identity verification thresholds.";
      }

      serverApplications.set(body.userId, app);

      return new Response(
        JSON.stringify({
          success: true,
          application: app,
          isVerified: app.status === "APPROVED",
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
