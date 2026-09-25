export type ModerationCategory =
  "clean" | "spam" | "harassment" | "phishing" | "dangerous_content" | "illegal_content";

export type ModerationStatus =
  "clean" | "flagged_for_review" | "warning_issued" | "hidden_pending_appeal" | "removed";

export interface ModerationAnalysisResult {
  category: ModerationCategory;
  confidence: number;
  status: ModerationStatus;
  reasons: string[];
  suggestedAction: "allow" | "flag_review" | "issue_warning" | "temporary_hold";
  advisoryMessage?: string;
}

export interface ModerationQueueItem {
  id: string;
  targetId: string;
  targetType: "post" | "comment" | "story" | "profile" | "message";
  authorId: string;
  authorUsername?: string;
  snippet: string;
  category: ModerationCategory;
  confidence: number;
  status: ModerationStatus;
  reasons: string[];
  createdAt: string;
  updatedAt: string;
  appealSubmitted: boolean;
  appealReason?: string;
  appealStatus?: "none" | "pending" | "in_review" | "approved_restored" | "rejected_upheld";
}

export interface ContentReportPayload {
  reporterId: string;
  targetType: "post" | "comment" | "story" | "profile" | "message";
  targetId: string;
  reason: ModerationCategory | "impersonation" | "hate_speech" | "other";
  details: string;
}

const LOCAL_QUEUE_KEY = "opexnal_moderation_queue_v2";

export function getLocalModerationQueue(): ModerationQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalModerationQueue(items: ModerationQueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("opexnal:moderation-updated", { detail: items }));
  } catch {
    // ignore
  }
}

export async function analyzeContentServer(
  text: string,
  context?: { targetType?: string; authorId?: string },
): Promise<ModerationAnalysisResult> {
  try {
    const res = await fetch("/api/moderation/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context }),
    });
    if (res.ok) {
      return (await res.json()) as ModerationAnalysisResult;
    }
  } catch {
    // fallback client analysis
  }

  return performClientModerationScan(text);
}

export function performClientModerationScan(text: string): ModerationAnalysisResult {
  const lower = text.toLowerCase();
  const reasons: string[] = [];

  // Phishing detection
  const phishingPatterns = [
    /free\s+(crypto|btc|eth|robux|gift\s*card)/i,
    /verify\s+your\s+account\s+here\s*[:=]\s*http/i,
    /enter\s+seed\s+phrase/i,
    /claim\s+1000\s*\$/i,
    /login\s+to\s+claim\s+reward/i,
  ];
  for (const pattern of phishingPatterns) {
    if (pattern.test(text)) {
      reasons.push("Potential phishing / deceptive link heuristic detected.");
      return {
        category: "phishing",
        confidence: 0.88,
        status: "flagged_for_review",
        reasons,
        suggestedAction: "flag_review",
        advisoryMessage:
          "This message contains patterns consistent with phishing or unverified reward claims.",
      };
    }
  }

  // Harassment detection
  const harassmentPatterns = [
    /\b(kill\s+yourself|go\s+die|die\s+in\s+a\s+hole)\b/i,
    /\b(doxx|swat\s+you|find\s+where\s+you\s+live)\b/i,
  ];
  for (const pattern of harassmentPatterns) {
    if (pattern.test(text)) {
      reasons.push("Explicit threat or targeted harassment language detected.");
      return {
        category: "harassment",
        confidence: 0.94,
        status: "warning_issued",
        reasons,
        suggestedAction: "issue_warning",
        advisoryMessage:
          "Opexnal Community Guidelines prohibit severe targeted threats or harassment.",
      };
    }
  }

  // Spam detection (repetitive bombardment, keyword stuffing)
  const spamKeywords = [
    "follow4follow",
    "f4f",
    "like4like",
    "check my bio for link in bio cheap",
    "telegram dm for crypto",
  ];
  for (const kw of spamKeywords) {
    if (lower.includes(kw)) {
      reasons.push(`Commercial spam pattern detected: '${kw}'`);
      return {
        category: "spam",
        confidence: 0.82,
        status: "flagged_for_review",
        reasons,
        suggestedAction: "flag_review",
        advisoryMessage: "Flagged for potential automated promotional spam.",
      };
    }
  }

  // Dangerous / illegal content detection
  const dangerousPatterns = [/\b(buy\s+stolen\s+cards|carding\s+dumps|hire\s+a\s+hitman)\b/i];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      reasons.push("Solicitation of illegal goods or violent services.");
      return {
        category: "dangerous_content",
        confidence: 0.95,
        status: "hidden_pending_appeal",
        reasons,
        suggestedAction: "temporary_hold",
        advisoryMessage: "Held for safety review under Dangerous Content policies.",
      };
    }
  }

  return {
    category: "clean",
    confidence: 0.99,
    status: "clean",
    reasons: [],
    suggestedAction: "allow",
  };
}
