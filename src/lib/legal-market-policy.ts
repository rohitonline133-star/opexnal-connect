/**
 * Fail-closed market launch decisions.
 *
 * This is a policy primitive, not a country database or legal approval.
 * A market is launchable only when an explicit, current approval record is
 * supplied by a trusted server-side configuration/data source.
 */
export type MarketReviewStatus =
  "NOT_REVIEWED" | "IN_REVIEW" | "BLOCKED" | "LIMITED_FEATURES" | "APPROVED";

export type MarketApprovalRecord = {
  status: MarketReviewStatus;
  reviewedAt: string;
  reviewExpiresAt: string;
  counselReference: string;
  approvedFeatures?: readonly string[];
};

export type MarketLaunchDecision =
  | { allowed: true; status: "APPROVED"; reason: "CURRENT_COUNSEL_APPROVAL" }
  | {
      allowed: false;
      status: MarketReviewStatus | "NOT_REVIEWED";
      reason:
        | "INVALID_MARKET_CODE"
        | "NO_REVIEW_RECORD"
        | "NOT_APPROVED"
        | "REVIEW_EXPIRED"
        | "INVALID_APPROVAL_EVIDENCE";
    };

const MARKET_CODE_PATTERN = /^[A-Z]{2}$/;

export function getMarketLaunchDecision(
  marketCode: string,
  approvals: Readonly<Record<string, MarketApprovalRecord>>,
  now: Date = new Date(),
): MarketLaunchDecision {
  const normalizedCode = marketCode.trim().toUpperCase();
  if (!MARKET_CODE_PATTERN.test(normalizedCode)) {
    return { allowed: false, status: "NOT_REVIEWED", reason: "INVALID_MARKET_CODE" };
  }

  const record = approvals[normalizedCode];
  if (!record) {
    return { allowed: false, status: "NOT_REVIEWED", reason: "NO_REVIEW_RECORD" };
  }

  if (record.status !== "APPROVED") {
    return { allowed: false, status: record.status, reason: "NOT_APPROVED" };
  }

  const reviewedAt = Date.parse(record.reviewedAt);
  const expiresAt = Date.parse(record.reviewExpiresAt);
  if (
    !Number.isFinite(reviewedAt) ||
    !Number.isFinite(expiresAt) ||
    !record.counselReference.trim() ||
    expiresAt <= reviewedAt
  ) {
    return { allowed: false, status: "NOT_REVIEWED", reason: "INVALID_APPROVAL_EVIDENCE" };
  }

  if (now.getTime() < reviewedAt || now.getTime() >= expiresAt) {
    return { allowed: false, status: "NOT_REVIEWED", reason: "REVIEW_EXPIRED" };
  }

  return { allowed: true, status: "APPROVED", reason: "CURRENT_COUNSEL_APPROVAL" };
}

export function isMarketFeatureAllowed(
  marketCode: string,
  feature: string,
  approvals: Readonly<Record<string, MarketApprovalRecord>>,
  now: Date = new Date(),
): boolean {
  const decision = getMarketLaunchDecision(marketCode, approvals, now);
  if (!decision.allowed) return false;

  const record = approvals[marketCode.trim().toUpperCase()];
  if (!record) return false;
  // An omitted feature list means no feature has been specifically approved.
  return Boolean(record.approvedFeatures?.includes(feature));
}
