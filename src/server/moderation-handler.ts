import type {
  ModerationAnalysisResult,
  ModerationQueueItem,
  ModerationCategory,
} from "../lib/moderation";
import { performClientModerationScan } from "../lib/moderation";

// Server-side moderation queue
const serverModerationQueue: ModerationQueueItem[] = [
  {
    id: "mod_seed_1",
    targetId: "post_sample_flagged",
    targetType: "post",
    authorId: "usr_seed_user",
    authorUsername: "unknown_promoter",
    snippet: "Check link in my bio for free crypto giveaway $1000!!",
    category: "phishing",
    confidence: 0.89,
    status: "flagged_for_review",
    reasons: ["Potential deceptive link pattern and unverified giveaway"],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    appealSubmitted: false,
    appealStatus: "none",
  },
];

export async function handleModerationRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // 1. Analyze text for safety
  if (request.method === "POST" && url.pathname === "/api/moderation/analyze") {
    try {
      const body = (await request.json()) as {
        text?: string;
        context?: { targetType?: string; authorId?: string };
      };
      const text = body.text || "";
      const result: ModerationAnalysisResult = performClientModerationScan(text);

      // If item is flagged or warning issued, record it in server moderation queue
      // Notice: we DO NOT delete the content! We flag it with status and allow review/appeal
      if (result.status !== "clean") {
        const item: ModerationQueueItem = {
          id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          targetId: `target_${Date.now()}`,
          targetType: (body.context?.targetType as ModerationQueueItem["targetType"]) || "post",
          authorId: body.context?.authorId || "anonymous",
          snippet: text.slice(0, 160),
          category: result.category,
          confidence: result.confidence,
          status: result.status,
          reasons: result.reasons,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          appealSubmitted: false,
          appealStatus: "none",
        };
        serverModerationQueue.unshift(item);
      }

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 2. Submit user content report
  if (request.method === "POST" && url.pathname === "/api/moderation/report") {
    try {
      const body = (await request.json()) as {
        reporterId: string;
        targetType: "post" | "comment" | "story" | "profile" | "message";
        targetId: string;
        reason: string;
        details?: string;
      };

      const newItem: ModerationQueueItem = {
        id: `mod_rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        targetId: body.targetId,
        targetType: body.targetType,
        authorId: "reported_entity",
        snippet: body.details || `Reported for: ${body.reason}`,
        category: ([
          "spam",
          "harassment",
          "phishing",
          "dangerous_content",
          "illegal_content",
        ].includes(body.reason)
          ? body.reason
          : "harassment") as ModerationCategory,
        confidence: 0.75,
        status: "flagged_for_review",
        reasons: [
          `User report submitted: ${body.reason}. Details: ${body.details || "None provided"}`,
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        appealSubmitted: false,
        appealStatus: "none",
      };

      serverModerationQueue.unshift(newItem);

      return new Response(
        JSON.stringify({
          success: true,
          reportId: newItem.id,
          message: "Report received and queued for Trust & Safety review.",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    } catch {
      return new Response(JSON.stringify({ error: "Invalid report payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 3. Get moderation queue (for author status / admin review)
  if (request.method === "GET" && url.pathname === "/api/moderation/queue") {
    return new Response(JSON.stringify({ items: serverModerationQueue }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Submit appeal for a flagged item
  if (request.method === "POST" && url.pathname === "/api/moderation/appeal") {
    try {
      const body = (await request.json()) as { queueId: string; appealReason: string };
      const item = serverModerationQueue.find((i) => i.id === body.queueId);
      if (!item) {
        return new Response(JSON.stringify({ error: "Moderation record not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      item.appealSubmitted = true;
      item.appealReason = body.appealReason;
      item.appealStatus = "in_review";
      item.updatedAt = new Date().toISOString();

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Appeal submitted. A human moderator will review your content against community standards.",
          item,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch {
      return new Response(JSON.stringify({ error: "Invalid appeal request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 5. Moderator resolution
  if (request.method === "POST" && url.pathname === "/api/moderation/review") {
    try {
      const body = (await request.json()) as {
        queueId: string;
        decision: "restore" | "uphold_warning" | "remove";
        moderatorNotes?: string;
      };

      const item = serverModerationQueue.find((i) => i.id === body.queueId);
      if (!item) {
        return new Response(JSON.stringify({ error: "Moderation record not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (body.decision === "restore") {
        item.status = "clean";
        item.appealStatus = "approved_restored";
      } else if (body.decision === "uphold_warning") {
        item.status = "warning_issued";
        item.appealStatus = "rejected_upheld";
      } else if (body.decision === "remove") {
        item.status = "removed";
        item.appealStatus = "rejected_upheld";
      }
      item.updatedAt = new Date().toISOString();

      return new Response(JSON.stringify({ success: true, item }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid review action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Endpoint not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
