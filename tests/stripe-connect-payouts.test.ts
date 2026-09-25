import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { handleMonetizationRequest, serverPayouts, serverWallets } from "../src/server/monetization-handler.ts";
import {
  verifyStripeWebhookSignature,
  getProviderHealth,
  isStripeConfigured,
  resetWebhookIdempotencyCache,
} from "../src/server/stripe-payout-provider.ts";

describe("Real Payment Provider - Stripe Connect Health & Status", () => {
  test("Health endpoint accurately reports Stripe Connect provider status", async () => {
    const req = new Request("http://localhost:3000/api/monetization/health", {
      method: "GET",
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.status, "healthy");
    assert.strictEqual(body.paymentProviderName, "Stripe Connect");

    // In environment without live secrets, it MUST report not configured rather than faking success
    if (!process.env["STRIPE_SECRET_KEY"]) {
      assert.strictEqual(body.paymentGatewayConfigured, false);
      assert.strictEqual(body.realPaymentProviderVerified, false);
      assert.ok(body.notice.includes("REAL PAYMENT PROVIDER: NOT CONFIGURED"));
    }
  });

  test("Provider health helper reports livemode and configuration accurately", () => {
    const health = getProviderHealth();
    assert.strictEqual(health.provider, "Stripe Connect");
    assert.strictEqual(typeof health.configured, "boolean");
    assert.strictEqual(typeof health.livemode, "boolean");
    assert.strictEqual(typeof health.webhookSecretConfigured, "boolean");
    assert.ok(health.statusMessage.length > 0);
  });
});

describe("Stripe Connect - Creator Account Onboarding & Dashboard", () => {
  test("Unauthenticated request to connect onboard returns 401", async () => {
    const req = new Request("http://localhost:3000/api/monetization/connect/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "creator@example.com" }),
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 401);
  });

  test("Authenticated creator onboarding fails gracefully when STRIPE_SECRET_KEY is not configured", async () => {
    if (!isStripeConfigured()) {
      const req = new Request("http://localhost:3000/api/monetization/connect/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-user-id": "usr_creator_connect_1",
          "x-test-role": "creator",
        },
        body: JSON.stringify({
          email: "creator@opexnal.test",
          country: "US",
        }),
      });
      const res = await handleMonetizationRequest(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes("REAL PAYMENT PROVIDER: NOT CONFIGURED"));
      assert.strictEqual(data.realPaymentProviderVerified, false);
    }
  });

  test("Missing accountId parameter on connect status returns 400", async () => {
    const req = new Request("http://localhost:3000/api/monetization/connect/status", {
      method: "GET",
      headers: {
        "x-test-user-id": "usr_creator_connect_1",
        "x-test-role": "creator",
      },
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("Missing accountId"));
  });
});

describe("Cryptographic Webhook Signature & Replay Verification", () => {
  const testSecret = "whsec_test_secret_for_cryptographic_verification_123456";

  test("Rejects webhook with expired or future timestamp outside tolerance", () => {
    const payload = JSON.stringify({ id: "evt_expired_1", type: "payout.paid" });
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const sigPayload = `${expiredTimestamp}.${payload}`;
    const hmac = crypto.createHmac("sha256", testSecret).update(sigPayload).digest("hex");
    const header = `t=${expiredTimestamp},v1=${hmac}`;

    const result = verifyStripeWebhookSignature(payload, header, testSecret, 300);
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes("tolerance window"));
  });

  test("Rejects webhook with tampered body or incorrect HMAC", () => {
    const payload = JSON.stringify({ id: "evt_tampered", type: "payout.paid", amount: 5000 });
    const tamperedPayload = JSON.stringify({ id: "evt_tampered", type: "payout.paid", amount: 999999 });
    const timestamp = Math.floor(Date.now() / 1000);
    const sigPayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac("sha256", testSecret).update(sigPayload).digest("hex");
    const header = `t=${timestamp},v1=${hmac}`;

    const result = verifyStripeWebhookSignature(tamperedPayload, header, testSecret, 300);
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes("signature mismatch"));
  });

  test("Accepts webhook with pristine body and valid HMAC-SHA256 signature", () => {
    const payload = JSON.stringify({ id: "evt_valid_sig", type: "payout.paid" });
    const timestamp = Math.floor(Date.now() / 1000);
    const sigPayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac("sha256", testSecret).update(sigPayload).digest("hex");
    const header = `t=${timestamp},v1=${hmac}`;

    const result = verifyStripeWebhookSignature(payload, header, testSecret, 300);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.timestamp, timestamp);
  });
});

describe("Concurrent Payout Prevention & Strict Validation", () => {
  test("Rejects concurrent payout requests when one is already in review or processing", async () => {
    const creatorId = "usr_concurrent_test_creator";

    // 1. Initial payout request of $50.00
    const req1 = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": creatorId,
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 5000 }),
    });
    const res1 = await handleMonetizationRequest(req1);
    assert.strictEqual(res1.status, 201);
    const data1 = await res1.json();
    assert.strictEqual(data1.payout.status, "in_review");

    // 2. Immediate second payout request by same user must be blocked with HTTP 409
    const req2 = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": creatorId,
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 5000 }),
    });
    const res2 = await handleMonetizationRequest(req2);
    assert.strictEqual(res2.status, 409);
    const data2 = await res2.json();
    assert.ok(data2.error.includes("CONCURRENT_PAYOUT_IN_PROGRESS"));
  });

  test("Rejects non-finite, NaN, and negative payout amounts", async () => {
    const reqNaN = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_math_attack",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: "not_a_number" }),
    });
    const resNaN = await handleMonetizationRequest(reqNaN);
    assert.strictEqual(resNaN.status, 400);

    const reqInfinity = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_math_attack",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: Infinity }),
    });
    const resInfinity = await handleMonetizationRequest(reqInfinity);
    assert.strictEqual(resInfinity.status, 400);
  });
});

describe("Complete Real Payment Provider Lifecycle & Webhook Reconciliation", () => {
  const creatorId = "usr_creator_e2e_reconciliation";

  test("End-to-End Payout flow: in_review -> approved -> payable -> payout_initiated -> verified webhook PAID", async () => {
    resetWebhookIdempotencyCache();

    // 1. Creator submits payout request
    const reqCreate = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": creatorId,
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 7500 }), // $75.00
    });
    const resCreate = await handleMonetizationRequest(reqCreate);
    assert.strictEqual(resCreate.status, 201);
    const { payout } = await resCreate.json();
    assert.strictEqual(payout.status, "in_review");

    // 2. Admin approves: in_review -> approved
    const resApprove = await handleMonetizationRequest(
      new Request("http://localhost:3000/api/monetization/payouts/transition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-user-id": "usr_admin",
          "x-test-role": "super_admin",
        },
        body: JSON.stringify({ payoutId: payout.id, targetStatus: "approved" }),
      }),
    );
    assert.strictEqual(resApprove.status, 200);

    // 3. Admin queues for payment: approved -> payable
    const resPayable = await handleMonetizationRequest(
      new Request("http://localhost:3000/api/monetization/payouts/transition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-user-id": "usr_admin",
          "x-test-role": "super_admin",
        },
        body: JSON.stringify({ payoutId: payout.id, targetStatus: "payable" }),
      }),
    );
    assert.strictEqual(resPayable.status, 200);

    // 4. Admin initiates transfer: payable -> payout_initiated
    const resInitiate = await handleMonetizationRequest(
      new Request("http://localhost:3000/api/monetization/payouts/transition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-user-id": "usr_admin",
          "x-test-role": "super_admin",
        },
        body: JSON.stringify({ payoutId: payout.id, targetStatus: "payout_initiated" }),
      }),
    );
    assert.strictEqual(resInitiate.status, 200);
    const dataInitiate = await resInitiate.json();
    assert.strictEqual(dataInitiate.payout.status, "payout_initiated");

    // 5. Database rule check: admin CANNOT transition directly to PAID
    const resManualPaid = await handleMonetizationRequest(
      new Request("http://localhost:3000/api/monetization/payouts/transition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-user-id": "usr_admin",
          "x-test-role": "super_admin",
        },
        body: JSON.stringify({ payoutId: payout.id, targetStatus: "paid" }),
      }),
    );
    assert.strictEqual(resManualPaid.status, 400);
    const dataManualPaid = await resManualPaid.json();
    assert.ok(dataManualPaid.error.includes("MANUAL_PAID_TRANSITION_PROHIBITED"));

    // 6. Payment provider sends verified payout.paid webhook
    const officialStripePayoutId = "po_1Q78902eZvKYlo2CLiveVerifiedTransfer";
    const webhookEvent = {
      id: "evt_stripe_payout_paid_e2e_001",
      type: "payout.paid",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: officialStripePayoutId,
          amount: 7500,
          currency: "usd",
          status: "paid",
          metadata: {
            payoutId: payout.id,
            userId: creatorId,
          },
        },
      },
    };

    const reqWebhook = new Request("http://localhost:3000/api/monetization/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=mock_verified_signature`,
      },
      body: JSON.stringify(webhookEvent),
    });
    const resWebhook = await handleMonetizationRequest(reqWebhook);
    assert.strictEqual(resWebhook.status, 200);
    const webhookResult = await resWebhook.json();

    assert.strictEqual(webhookResult.status, "processed");
    assert.strictEqual(webhookResult.payoutNewStatus, "paid");
    assert.strictEqual(webhookResult.gatewayReference, officialStripePayoutId);

    // 7. Verify authoritative payout state in server memory
    const updatedPayout = serverPayouts.get(payout.id);
    assert.ok(updatedPayout);
    assert.strictEqual(updatedPayout.status, "paid");
    assert.strictEqual(updatedPayout.gatewayReference, officialStripePayoutId);
    assert.ok(updatedPayout.completedAt);

    // 8. Replayed webhook with same eventId is safely de-duplicated
    const reqWebhookReplay = new Request("http://localhost:3000/api/monetization/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=mock_verified_signature`,
      },
      body: JSON.stringify(webhookEvent),
    });
    const resReplay = await handleMonetizationRequest(reqWebhookReplay);
    assert.strictEqual(resReplay.status, 200);
    const replayResult = await resReplay.json();
    assert.strictEqual(replayResult.status, "ignored_duplicate_replay");
  });

  test("Provider payout failure event updates payout to 'failed' with failure reason", async () => {
    // 1. Submit payout for failure handling test
    const reqCreate = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_creator_fail_event",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 5200 }),
    });
    const resCreate = await handleMonetizationRequest(reqCreate);
    const { payout } = await resCreate.json();

    // 2. Stripe sends payout.failed webhook
    const failEvent = {
      id: "evt_stripe_payout_failed_001",
      type: "payout.failed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "po_fail_12345",
          amount: 5200,
          status: "failed",
          failure_code: "account_number_invalid",
          failure_message: "The bank account details provided were rejected by the receiving financial institution.",
          metadata: {
            payoutId: payout.id,
            userId: "usr_creator_fail_event",
          },
        },
      },
    };

    const reqWebhook = new Request("http://localhost:3000/api/monetization/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=mock_fail_sig`,
      },
      body: JSON.stringify(failEvent),
    });
    const resWebhook = await handleMonetizationRequest(reqWebhook);
    assert.strictEqual(resWebhook.status, 200);
    const failResult = await resWebhook.json();

    assert.strictEqual(failResult.status, "processed");
    assert.strictEqual(failResult.payoutNewStatus, "failed");

    const failedPayout = serverPayouts.get(payout.id);
    assert.ok(failedPayout);
    assert.strictEqual(failedPayout.status, "failed");
    assert.strictEqual(failedPayout.failureReason, "account_number_invalid");
  });
});
