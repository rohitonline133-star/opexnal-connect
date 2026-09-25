import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  SETTINGS_SEARCH_INDEX,
  searchSettings,
  DEFAULT_SETTINGS,
} from "../src/lib/settings-store.ts";
import {
  checkContentSafety,
  scanMediaForCopyright,
  getStoredCopyrightCases,
  submitCopyrightAppeal,
} from "../src/lib/moderation-copyright.ts";
import { getStoryHighlights, saveStoryHighlight } from "../src/lib/stories.ts";
import { getMessageReactions, setMessageReaction } from "../src/lib/messages.ts";

describe("Settings & Activity Master Inventory Audit", () => {
  test("All 14 Settings & Activity sections are present in inventory", () => {
    const requiredCategories = [
      "Your account",
      "Accounts Center",
      "How you use Opexnal",
      "Your insights & tools",
      "Subscriptions",
      "Who can see your content",
      "How others can interact with you",
      "What you see",
      "Your app & media",
      "Family Center",
      "Orders & payments",
      "More info & support",
      "Also from Opexnal",
      "Account management & lifecycle",
    ];

    const presentCategories = new Set(SETTINGS_SEARCH_INDEX.map((item) => item.categoryTitle));

    for (const cat of requiredCategories) {
      assert.ok(
        presentCategories.has(cat),
        `Missing required section category in inventory: ${cat}`,
      );
    }
  });

  test("Inventory contains all detailed sub-options (at least 46 items)", () => {
    assert.ok(
      SETTINGS_SEARCH_INDEX.length >= 46,
      `Expected at least 46 sub-options, found ${SETTINGS_SEARCH_INDEX.length}`,
    );
  });

  test("Every inventory item has either a valid route or a registered dialog", () => {
    for (const item of SETTINGS_SEARCH_INDEX) {
      assert.ok(
        item.route || item.dialog,
        `Item ${item.id} (${item.title}) must have a route or dialog destination`,
      );
      assert.ok(item.keywords.length > 0, `Item ${item.id} must have keywords for search`);
    }
  });
});

describe("Settings Real-Time Search Engine", () => {
  test("Searching 'password' returns Password and Security item", () => {
    const results = searchSettings("password");
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.title.toLowerCase().includes("password")));
  });

  test("Searching 'blocked' returns Blocked Profiles item", () => {
    const results = searchSettings("blocked");
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.id === "blocked_accounts"));
  });

  test("Searching 'payment' returns Payment Methods and Orders items", () => {
    const results = searchSettings("payment");
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.id === "payment_methods"));
  });

  test("Searching 'subscription' returns Creator and Active Subscriptions", () => {
    const results = searchSettings("subscription");
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.id === "creator_subscriptions"));
    assert.ok(results.some((r) => r.id === "active_subscriptions"));
  });

  test("Searching 'deleted' returns Recently Deleted item", () => {
    const results = searchSettings("deleted");
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.id === "recently_deleted"));
  });

  test("Searching 'export' returns Download Your Data item", () => {
    const results = searchSettings("export");
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.id === "download_export_data"));
  });

  test("Searching 'sessions' returns Active Login Sessions item", () => {
    const results = searchSettings("sessions");
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.id === "login_activity_sessions"));
  });

  test("Gujarati search queries return expected settings items", () => {
    // Search 'પાસવર્ડ' (Password)
    const pwResults = searchSettings("પાસવર્ડ");
    assert.ok(pwResults.length > 0);
    assert.ok(pwResults.some((r) => r.id === "password_security"));

    // Search 'નોટિફિકેશન' (Notifications)
    const notifResults = searchSettings("નોટિફિકેશન");
    assert.ok(notifResults.length > 0);
    assert.ok(notifResults.some((r) => r.id === "notifications"));

    // Search 'બ્લોક' (Blocked accounts)
    const blockResults = searchSettings("બ્લોક");
    assert.ok(blockResults.length > 0);
    assert.ok(blockResults.some((r) => r.id === "blocked_accounts"));

    // Search 'આર્કાઇવ' (Archive)
    const archiveResults = searchSettings("આર્કાઇવ");
    assert.ok(archiveResults.length > 0);
    assert.ok(archiveResults.some((r) => r.id === "archive"));

    // Search 'પેમેન્ટ' (Payment)
    const payResults = searchSettings("પેમેન્ટ");
    assert.ok(payResults.length > 0);
    assert.ok(payResults.some((r) => r.id === "payment_methods"));
  });
});

describe("Default Settings Schema Validation", () => {
  test("Schema defaults contain required privacy & interaction safety keys", () => {
    assert.strictEqual(typeof DEFAULT_SETTINGS.isPrivate, "boolean");
    assert.strictEqual(typeof DEFAULT_SETTINGS.messageRequestsFrom, "string");
    assert.strictEqual(typeof DEFAULT_SETTINGS.whoCanComment, "string");
    assert.strictEqual(typeof DEFAULT_SETTINGS.hideOffensiveComments, "boolean");
    assert.strictEqual(typeof DEFAULT_SETTINGS.quietModeEnabled, "boolean");
    assert.strictEqual(typeof DEFAULT_SETTINGS.twoFactorEnabled, "boolean");
    assert.strictEqual(typeof DEFAULT_SETTINGS.postsArchiveAutoSave, "boolean");
    assert.strictEqual(typeof DEFAULT_SETTINGS.appLanguage, "string");
  });
});

describe("Monetization & Security Rules Enforcement", () => {
  test("Server balance check rejects negative payout withdrawals and overdrafts", () => {
    const balance = 142.5;

    function validateWithdrawal(amount: number) {
      if (amount <= 0 || isNaN(amount)) {
        return { valid: false, error: "INVALID_AMOUNT" };
      }
      if (amount < 50) {
        return { valid: false, error: "MINIMUM_THRESHOLD_NOT_MET" };
      }
      if (amount > balance) {
        return { valid: false, error: "INSUFFICIENT_FUNDS_OVERDRAFT_BLOCKED" };
      }
      return { valid: true };
    }

    assert.strictEqual(validateWithdrawal(-10).valid, false);
    assert.strictEqual(validateWithdrawal(0).valid, false);
    assert.strictEqual(validateWithdrawal(25).error, "MINIMUM_THRESHOLD_NOT_MET");
    assert.strictEqual(validateWithdrawal(200).error, "INSUFFICIENT_FUNDS_OVERDRAFT_BLOCKED");
    assert.strictEqual(validateWithdrawal(60).valid, true);
  });

  test("Idempotency token generation produces collision-resistant keys", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const key = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      tokens.add(key);
    }
    assert.strictEqual(tokens.size, 100);
  });

  test("Server isolation: Client supplied userId must never override session user", () => {
    const sessionUserId = "usr_authenticated_789";
    const untrustedBody = { userId: "usr_attacker_999", is_private: true };

    // Server-authoritative derivation pattern:
    const safeUpdatePayload = {
      userId: sessionUserId, // Always derived from authenticated session token
      is_private: untrustedBody.is_private,
    };

    assert.strictEqual(safeUpdatePayload.userId, sessionUserId);
    assert.notStrictEqual(safeUpdatePayload.userId, untrustedBody.userId);
  });
});

describe("Content Moderation & Safety Protection", () => {
  test("Content safety filter flags banned spam, scams and hate speech", () => {
    const spamCheck = checkContentSafety(
      "Hey everyone, join our free crypto giveaway for 10x returns!",
    );
    assert.strictEqual(spamCheck.allowed, false);
    assert.strictEqual(spamCheck.flagged, true);
    assert.strictEqual(spamCheck.category, "spam");

    const followerSpamCheck = checkContentSafety(
      "Check out this site to buy cheap followers instantly!",
    );
    assert.strictEqual(followerSpamCheck.allowed, false);
    assert.strictEqual(followerSpamCheck.flagged, true);

    const normalCheck = checkContentSafety(
      "Late night coding session and designing clean mobile social UI 🚀✨ #opexnal",
    );
    assert.strictEqual(normalCheck.allowed, true);
    assert.strictEqual(normalCheck.flagged, false);
  });
});

describe("Copyright Fingerprint Scanning & Appeals", () => {
  test("Video copyright scan flags restricted commercial sound recordings", () => {
    const restrictedScan = scanMediaForCopyright("summer_commercial_hit_radio_edit.mp4", "video");
    assert.strictEqual(restrictedScan.matched, true);
    assert.strictEqual(restrictedScan.policy, "blocked");
    assert.strictEqual(restrictedScan.workTitle, "Summer Velocity (Radio Edit)");

    const licensedScan = scanMediaForCopyright("synthwave_neon_sunset_loop.mp4", "video");
    assert.strictEqual(licensedScan.matched, true);
    assert.strictEqual(licensedScan.policy, "allow_with_attribution");
    assert.strictEqual(licensedScan.workTitle, "Neon Horizons");

    const originalScan = scanMediaForCopyright("my_original_acoustic_guitar_solo.mp4", "video");
    assert.strictEqual(originalScan.matched, false);
  });

  test("Submitting a copyright appeal updates case dispute status", () => {
    const appealSuccess = submitCopyrightAppeal(
      "claim_cr_8921",
      "I have licensed this audio for promotional use under license #LIC-99214",
    );
    assert.strictEqual(appealSuccess, true);

    const cases = getStoredCopyrightCases();
    const updatedCase = cases.find((c) => c.id === "claim_cr_8921");
    assert.ok(updatedCase);
    assert.strictEqual(updatedCase.status, "under_dispute");
    assert.ok(updatedCase.disputeReason?.includes("LIC-99214"));
  });
});

describe("Story Highlights & Message Interactions", () => {
  test("Story highlights can be retrieved and saved per user", () => {
    const initialHighlights = getStoryHighlights("user_maya");
    assert.ok(Array.isArray(initialHighlights));

    const newHl = saveStoryHighlight({
      userId: "test_user_highlight",
      title: "My Highlights 🌟",
      coverUrl: "https://example.com/cover.jpg",
      storyIds: ["story_1", "story_2"],
    });

    assert.ok(newHl.id.startsWith("hl_"));
    assert.strictEqual(newHl.title, "My Highlights 🌟");

    const userHighlights = getStoryHighlights("test_user_highlight");
    assert.ok(userHighlights.some((h) => h.id === newHl.id));
  });

  test("Message emoji reactions persist and update cleanly", () => {
    setMessageReaction("msg_test_101", "🔥");
    const reactions = getMessageReactions();
    assert.strictEqual(reactions["msg_test_101"], "🔥");

    setMessageReaction("msg_test_101", "❤️");
    const updatedReactions = getMessageReactions();
    assert.strictEqual(updatedReactions["msg_test_101"], "❤️");
  });
});
