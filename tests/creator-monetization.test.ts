import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateCreatorEligibility,
  calculateRevenueSplit,
  filterInvalidTraffic,
  sendVirtualGift,
  DEFAULT_PROGRAM_CONFIGS,
  GIFT_CATALOG,
  COIN_PACKS,
  ACTIVE_PERFORMANCE_CAMPAIGNS,
  SEED_BRAND_CAMPAIGNS,
  AFFILIATE_CATALOG,
  requestCreatorPayout,
} from "../src/lib/monetization.ts";
import { searchSettings } from "../src/lib/settings-store.ts";

describe("1. Creator Eligibility Engine", () => {
  test("Evaluates creator eligibility when all 8 prerequisites are met", async () => {
    const report = await evaluateCreatorEligibility("test_user_eligible", {
      followers: 2500,
      accountAgeDays: 90,
      views: 25000,
      watchTimeMinutes: 1200,
      twoFactor: true,
    });

    assert.strictEqual(report.isFullyEligible, true);
    assert.strictEqual(report.status, "eligible");
    assert.strictEqual(report.followersMet, true);
    assert.strictEqual(report.accountAgeMet, true);
    assert.strictEqual(report.viewsMet, true);
    assert.strictEqual(report.watchTimeMet, true);
    assert.strictEqual(report.twoFactorMet, true);
    assert.strictEqual(report.checklist.length, 8);
  });

  test("Marks status as not_eligible when followers requirement is unmet", async () => {
    const report = await evaluateCreatorEligibility("test_user_low_followers", {
      followers: 120, // Below 1,000 required
      accountAgeDays: 60,
      views: 20000,
      watchTimeMinutes: 800,
      twoFactor: true,
    });

    assert.strictEqual(report.isFullyEligible, false);
    assert.strictEqual(report.status, "not_eligible");
    assert.strictEqual(report.followersMet, false);
  });

  test("Marks status as in_review for borderline accounts with 500-999 followers", async () => {
    const report = await evaluateCreatorEligibility("test_user_borderline", {
      followers: 650,
      accountAgeDays: 45,
      views: 12000,
      watchTimeMinutes: 700,
      twoFactor: true,
    });

    assert.strictEqual(report.isFullyEligible, false);
    assert.strictEqual(report.status, "in_review");
  });
});

describe("2. Ad Revenue Sharing & Fraud Filtering", () => {
  test("Computes configurable creator/platform revenue split correctly", () => {
    // Default in-feed ads: 60% creator / 40% platform
    const splitDefault = calculateRevenueSplit("ad_revenue_share", 10000); // $100.00 gross
    assert.strictEqual(splitDefault.grossCents, 10000);
    assert.strictEqual(splitDefault.creatorNetCents, 6000); // $60.00
    assert.strictEqual(splitDefault.platformFeeCents, 4000); // $40.00

    // Custom administrator-configured 70/30 split
    const splitCustom = calculateRevenueSplit("ad_revenue_share", 10000, 70.0);
    assert.strictEqual(splitCustom.creatorNetCents, 7000);
    assert.strictEqual(splitCustom.platformFeeCents, 3000);
  });

  test("Fraud filtering detects sub-2-second bounces on vertical video", () => {
    const filterBounce = filterInvalidTraffic({
      creatorId: "creator_123",
      contentId: "reel_999",
      contentType: "reel",
      viewerId: "viewer_456",
      impressionType: "qualified_view",
      watchTimeSeconds: 1, // Invalid: under 2 seconds
    });

    assert.strictEqual(filterBounce.isValid, false);
    assert.strictEqual(filterBounce.reason, "BOUNCE_SUB_2_SECONDS");
  });

  test("Fraud filtering rejects self-impressions by creator", () => {
    const filterSelf = filterInvalidTraffic({
      creatorId: "creator_123",
      contentId: "post_888",
      contentType: "post",
      viewerId: "creator_123", // Same as creator
      impressionType: "impression",
      watchTimeSeconds: 10,
    });

    assert.strictEqual(filterSelf.isValid, false);
    assert.strictEqual(filterSelf.reason, "CREATOR_SELF_IMPRESSION");
  });

  test("Valid impressions pass anti-fraud inspection", () => {
    const filterValid = filterInvalidTraffic({
      creatorId: "creator_123",
      contentId: "reel_777",
      contentType: "reel",
      viewerId: "viewer_999",
      impressionType: "qualified_view",
      watchTimeSeconds: 14,
    });

    assert.strictEqual(filterValid.isValid, true);
  });
});

describe("3. Virtual Gifts & Coin Store", () => {
  test("Gift catalog contains valid coin costs and animated categories", () => {
    assert.ok(GIFT_CATALOG.length >= 8);
    for (const gift of GIFT_CATALOG) {
      assert.ok(gift.coinCost > 0);
      assert.ok(gift.icon.length > 0);
      assert.ok(gift.animation.length > 0);
    }
  });

  test("Coin pack catalog provides bulk bonus coins", () => {
    assert.ok(COIN_PACKS.length >= 5);
    const popularPack = COIN_PACKS.find((p) => p.isPopular);
    assert.ok(popularPack);
    assert.ok(popularPack.bonusCoins > 0);
  });

  test("Blocks sending virtual gift to oneself", async () => {
    const res = await sendVirtualGift({
      senderId: "usr_alice",
      recipientId: "usr_alice",
      giftId: "rose",
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "CANNOT_GIFT_SELF");
  });

  test("Blocks gifting when gift ID is unrecognized", async () => {
    const res = await sendVirtualGift({
      senderId: "usr_alice",
      recipientId: "usr_bob",
      giftId: "non_existent_gift",
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "GIFT_NOT_FOUND");
  });
});

describe("4. Creator Subscriptions & Revenue Share", () => {
  test("Fan subscriptions program allocates 90% to creator and 10% platform fee", () => {
    const subGrossCents = 499; // $4.99/mo
    const split = calculateRevenueSplit("creator_subscriptions", subGrossCents);

    assert.strictEqual(split.grossCents, 499);
    assert.strictEqual(split.creatorNetCents, 449); // 90% = $4.49
    assert.strictEqual(split.platformFeeCents, 50); // 10% = $0.50
  });

  test("Creator tier limits restrict minimum and maximum pricing bounds", () => {
    const config = DEFAULT_PROGRAM_CONFIGS.creator_subscriptions;
    assert.ok(config);
    const rules = config.rules as { minPriceCents: number; maxPriceCents: number };
    assert.strictEqual(rules.minPriceCents, 199);
    assert.strictEqual(rules.maxPriceCents, 4999);
  });
});

describe("5. Performance Rewards & Brand Marketplace", () => {
  test("Performance reward campaigns enforce maximum bonus limits", () => {
    assert.ok(ACTIVE_PERFORMANCE_CAMPAIGNS.length >= 2);
    for (const camp of ACTIVE_PERFORMANCE_CAMPAIGNS) {
      assert.ok(camp.maxCapCents >= camp.rewardCents);
      assert.ok(camp.milestoneThreshold > 0);
      assert.strictEqual(camp.isActive, true);
    }
  });

  test("Brand marketplace opportunities require verified deliverables & follower thresholds", () => {
    assert.ok(SEED_BRAND_CAMPAIGNS.length >= 3);
    for (const brand of SEED_BRAND_CAMPAIGNS) {
      assert.ok(brand.budgetCents > 0);
      assert.ok(brand.deliverablesRequired.length > 0);
      assert.ok(brand.requirementsMinFollowers >= 500);
    }
  });

  test("Affiliate catalog products have valid commission percentages", () => {
    assert.ok(AFFILIATE_CATALOG.length >= 3);
    for (const prod of AFFILIATE_CATALOG) {
      assert.ok(prod.commissionPct >= 8.0 && prod.commissionPct <= 25.0);
      assert.ok(prod.priceCents > 0);
    }
  });
});

describe("6. Payout Lifecycle & Compliance Engine", () => {
  test("Rejects payout withdrawals below minimum threshold ($50.00)", async () => {
    const res = await requestCreatorPayout("usr_test_payout", 2500); // $25.00
    assert.strictEqual(res.success, false);
    assert.ok(res.error?.includes("MINIMUM_THRESHOLD_NOT_MET"));
  });

  test("Rejects negative or NaN withdrawal amounts", async () => {
    const resNegative = await requestCreatorPayout("usr_test_payout", -5000);
    assert.strictEqual(resNegative.success, false);
    assert.strictEqual(resNegative.error, "INVALID_AMOUNT");

    const resZero = await requestCreatorPayout("usr_test_payout", 0);
    assert.strictEqual(resZero.success, false);
    assert.strictEqual(resZero.error, "INVALID_AMOUNT");
  });

  test("Rejects withdrawal requests that exceed available creator balance (overdraft)", async () => {
    const res = await requestCreatorPayout("usr_test_payout", 9999999); // $99,999.99
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, "INSUFFICIENT_FUNDS_OVERDRAFT_BLOCKED");
  });

  test("Accepts compliant withdrawal and initiates in_review lifecycle state", async () => {
    const res = await requestCreatorPayout("usr_test_compliant", 5000); // $50.00
    assert.strictEqual(res.success, true);
    assert.ok(res.payoutRequest);
    assert.strictEqual(res.payoutRequest.status, "in_review");
    assert.strictEqual(res.payoutRequest.amountCents, 5000);
    assert.ok(res.payoutRequest.payoutBatchId?.startsWith("BATCH_"));
  });
});

describe("7. Settings Search Index Integration", () => {
  test("Searching 'monetization' returns Creator Monetization Hub", () => {
    const results = searchSettings("monetization");
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.id === "creator_monetization_hub"));
  });

  test("Searching 'coins' or 'sparks' finds Creator Monetization Hub", () => {
    const resCoins = searchSettings("coins");
    assert.ok(resCoins.some((r) => r.id === "creator_monetization_hub"));

    const resSparks = searchSettings("sparks");
    assert.ok(resSparks.some((r) => r.id === "creator_monetization_hub"));
  });

  test("Searching 'affiliate' finds Creator Monetization Hub", () => {
    const res = searchSettings("affiliate");
    assert.ok(res.some((r) => r.id === "creator_monetization_hub"));
  });
});
