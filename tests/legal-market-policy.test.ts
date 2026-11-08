import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getMarketLaunchDecision,
  isMarketFeatureAllowed,
  type MarketApprovalRecord,
} from "../src/lib/legal-market-policy";

const now = new Date("2026-11-08T12:00:00.000Z");
const validRecord: MarketApprovalRecord = {
  status: "APPROVED",
  reviewedAt: "2026-10-01T00:00:00.000Z",
  reviewExpiresAt: "2027-01-01T00:00:00.000Z",
  counselReference: "counsel-review-2026-001",
  approvedFeatures: ["account-registration", "basic-feed"],
};

test("unknown markets fail closed by default", () => {
  assert.deepEqual(getMarketLaunchDecision("IN", {}, now), {
    allowed: false,
    status: "NOT_REVIEWED",
    reason: "NO_REVIEW_RECORD",
  });
});

test("invalid market codes fail closed", () => {
  for (const code of ["", "IND", "1N", "in-xx"]) {
    assert.equal(getMarketLaunchDecision(code, {}, now).allowed, false);
  }
});

test("only a current explicit counsel approval permits a market", () => {
  assert.deepEqual(getMarketLaunchDecision("in", { IN: validRecord }, now), {
    allowed: true,
    status: "APPROVED",
    reason: "CURRENT_COUNSEL_APPROVAL",
  });
});

test("in-review and blocked markets remain unavailable", () => {
  for (const status of ["IN_REVIEW", "BLOCKED", "LIMITED_FEATURES", "NOT_REVIEWED"] as const) {
    assert.equal(
      getMarketLaunchDecision("IN", { IN: { ...validRecord, status } }, now).allowed,
      false,
    );
  }
});

test("expired, future-dated or incomplete approvals fail closed", () => {
  const expired = { ...validRecord, reviewExpiresAt: "2026-11-01T00:00:00.000Z" };
  const future = { ...validRecord, reviewedAt: "2026-12-01T00:00:00.000Z" };
  const noEvidence = { ...validRecord, counselReference: " " };
  for (const record of [expired, future, noEvidence]) {
    assert.equal(getMarketLaunchDecision("IN", { IN: record }, now).allowed, false);
  }
  assert.equal(
    getMarketLaunchDecision("IN", { IN: validRecord }, new Date("invalid")).allowed,
    false,
  );
});

test("features require explicit approval even in an approved market", () => {
  const approvals = { IN: validRecord };
  assert.equal(isMarketFeatureAllowed("IN", "account-registration", approvals, now), true);
  assert.equal(isMarketFeatureAllowed("IN", "targeted-ads", approvals, now), false);
  assert.equal(isMarketFeatureAllowed("US", "basic-feed", approvals, now), false);
});
