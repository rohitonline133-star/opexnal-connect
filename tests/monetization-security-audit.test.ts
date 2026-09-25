import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { handleMonetizationRequest } from "../src/server/monetization-handler.ts";

describe("1. API Authentication & Route Protection", () => {
  test("Unauthenticated requests to /api/monetization/wallet return 401 Unauthorized", async () => {
    const req = new Request("http://localhost:3000/api/monetization/wallet", {
      method: "GET",
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error.includes("UNAUTHORIZED"));
  });

  test("Unauthenticated requests to /api/monetization/payouts/request return 401 Unauthorized", async () => {
    const req = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: 5000 }),
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 401);
  });
});

describe("2. User Isolation & IDOR Protection", () => {
  test("USER A cannot read USER B's wallet", async () => {
    const req = new Request("http://localhost:3000/api/monetization/wallet?userId=usr_user_b", {
      method: "GET",
      headers: {
        "x-test-user-id": "usr_user_a",
        "x-test-role": "user",
      },
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.includes("FORBIDDEN"));
  });

  test("USER A cannot inspect USER B's monetization eligibility report", async () => {
    const req = new Request(
      "http://localhost:3000/api/monetization/eligibility?userId=usr_user_b",
      {
        method: "GET",
        headers: {
          "x-test-user-id": "usr_user_a",
          "x-test-role": "user",
        },
      },
    );
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 403);
  });

  test("IDOR: Client cannot substitute victim userId in payout request body", async () => {
    const req = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_attacker",
        "x-test-role": "user",
      },
      body: JSON.stringify({
        userId: "usr_victim", // Attempted IDOR override
        amountCents: 5000,
      }),
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    // Server MUST bind the payout strictly to the session user (usr_attacker), never the body
    assert.strictEqual(body.payout.userId, "usr_attacker");
    assert.notStrictEqual(body.payout.userId, "usr_victim");
  });
});

describe("3. Creator Privileges & Admin Boundary", () => {
  test("CREATOR A cannot approve or mark their own payout as PAID", async () => {
    const req = new Request("http://localhost:3000/api/monetization/payouts/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_creator_a",
        "x-test-role": "creator", // Regular creator role
      },
      body: JSON.stringify({ payoutId: "payout_sample_123" }),
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.includes("FORBIDDEN"));
  });

  test("SUPER_ADMIN can approve pending payouts in review", async () => {
    // 1. Submit payout request as Creator A
    const reqCreate = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_creator_a",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 5000 }),
    });
    const resCreate = await handleMonetizationRequest(reqCreate);
    assert.strictEqual(resCreate.status, 201);
    const createData = await resCreate.json();

    // 2. Admin approves the payout
    const reqApprove = new Request("http://localhost:3000/api/monetization/payouts/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_admin",
        "x-test-role": "super_admin",
      },
      body: JSON.stringify({ payoutId: createData.payout.id }),
    });
    const resApprove = await handleMonetizationRequest(reqApprove);
    assert.strictEqual(resApprove.status, 200);
    const approveData = await resApprove.json();
    assert.strictEqual(approveData.payout.status, "approved");
  });
});

describe("4. Financial Balance Manipulation & Overdraft Protection", () => {
  test("Server blocks payout withdrawal exceeding available balance (overdraft)", async () => {
    const req = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_creator_b",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 5000000 }), // $50,000.00
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes("INSUFFICIENT_FUNDS_OVERDRAFT_BLOCKED"));
  });

  test("Server rejects non-positive or NaN payout amounts", async () => {
    const reqZero = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_creator_b",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 0 }),
    });
    const resZero = await handleMonetizationRequest(reqZero);
    assert.strictEqual(resZero.status, 400);

    const reqNeg = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_creator_b",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: -1500 }),
    });
    const resNeg = await handleMonetizationRequest(reqNeg);
    assert.strictEqual(resNeg.status, 400);
  });
});

describe("5. Payment Provider Integration & Webhook Security", () => {
  test("Webhook endpoint rejects unsigned requests (missing signature)", async () => {
    const req = new Request("http://localhost:3000/api/monetization/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "evt_123", type: "charge.succeeded" }),
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error.includes("UNAUTHORIZED_WEBHOOK"));
  });

  test("Webhook processes verified signature and de-duplicates replayed events", async () => {
    const eventPayload = { id: "evt_payment_unique_99", type: "payment_intent.succeeded" };

    // 1. Initial event with signature
    const req1 = new Request("http://localhost:3000/api/monetization/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1700000000,v1=mock_valid_signature_hash",
      },
      body: JSON.stringify(eventPayload),
    });
    const res1 = await handleMonetizationRequest(req1);
    assert.strictEqual(res1.status, 200);
    const body1 = await res1.json();
    assert.strictEqual(body1.status, "processed");

    // 2. Replay of same eventId
    const req2 = new Request("http://localhost:3000/api/monetization/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1700000000,v1=mock_valid_signature_hash",
      },
      body: JSON.stringify(eventPayload),
    });
    const res2 = await handleMonetizationRequest(req2);
    assert.strictEqual(res2.status, 200);
    const body2 = await res2.json();
    assert.strictEqual(body2.status, "ignored_duplicate_replay");
  });

  test("Health check verifies real payment provider credentials status", async () => {
    const req = new Request("http://localhost:3000/api/monetization/health", {
      method: "GET",
    });
    const res = await handleMonetizationRequest(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, "healthy");
    // In our container environment without live payment gateway secrets, it must mark:
    assert.strictEqual(body.realPaymentProviderVerified, false);
    assert.ok(body.notice.includes("REAL PAYMENT PROVIDER: NOT VERIFIED"));
  });
});

describe("6. Complete Payout State Machine & Provider Verification", () => {
  test("Full lifecycle transitions: in_review -> approved -> payable -> payout_initiated -> paid", async () => {
    // 1. Submit payout as creator
    const reqCreate = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_creator_lifecycle",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 6000 }),
    });
    const resCreate = await handleMonetizationRequest(reqCreate);
    assert.strictEqual(resCreate.status, 201);
    const { payout } = await resCreate.json();
    assert.strictEqual(payout.status, "in_review");

    // 2. Creator tries to transition to approved -> FORBIDDEN
    const reqUnauthorized = new Request(
      "http://localhost:3000/api/monetization/payouts/transition",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-user-id": "usr_creator_lifecycle",
          "x-test-role": "creator",
        },
        body: JSON.stringify({ payoutId: payout.id, targetStatus: "approved" }),
      },
    );
    const resUnauthorized = await handleMonetizationRequest(reqUnauthorized);
    assert.strictEqual(resUnauthorized.status, 403);

    // 3. Admin transitions: in_review -> approved
    const reqApprove = new Request("http://localhost:3000/api/monetization/payouts/transition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_admin",
        "x-test-role": "super_admin",
      },
      body: JSON.stringify({ payoutId: payout.id, targetStatus: "approved" }),
    });
    const resApprove = await handleMonetizationRequest(reqApprove);
    assert.strictEqual(resApprove.status, 200);
    const dataApprove = await resApprove.json();
    assert.strictEqual(dataApprove.payout.status, "approved");

    // 4. Admin tries invalid jump: approved -> paid (skipping payable and payout_initiated) -> BLOCKED
    const reqInvalidJump = new Request(
      "http://localhost:3000/api/monetization/payouts/transition",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-user-id": "usr_admin",
          "x-test-role": "super_admin",
        },
        body: JSON.stringify({ payoutId: payout.id, targetStatus: "paid" }),
      },
    );
    const resInvalidJump = await handleMonetizationRequest(reqInvalidJump);
    assert.strictEqual(resInvalidJump.status, 400);

    // 5. Admin transitions: approved -> payable
    const reqPayable = new Request("http://localhost:3000/api/monetization/payouts/transition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_admin",
        "x-test-role": "super_admin",
      },
      body: JSON.stringify({ payoutId: payout.id, targetStatus: "payable" }),
    });
    const resPayable = await handleMonetizationRequest(reqPayable);
    assert.strictEqual(resPayable.status, 200);

    // 6. Admin transitions: payable -> payout_initiated
    const reqInitiate = new Request("http://localhost:3000/api/monetization/payouts/transition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_admin",
        "x-test-role": "super_admin",
      },
      body: JSON.stringify({ payoutId: payout.id, targetStatus: "payout_initiated" }),
    });
    const resInitiate = await handleMonetizationRequest(reqInitiate);
    assert.strictEqual(resInitiate.status, 200);

    // 7. Admin transitions: payout_initiated -> paid
    const reqPaid = new Request("http://localhost:3000/api/monetization/payouts/transition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_admin",
        "x-test-role": "super_admin",
      },
      body: JSON.stringify({ payoutId: payout.id, targetStatus: "paid" }),
    });
    const resPaid = await handleMonetizationRequest(reqPaid);
    assert.strictEqual(resPaid.status, 200);
    const dataPaid = await resPaid.json();
    assert.strictEqual(dataPaid.payout.status, "paid");
    assert.ok(dataPaid.payout.completedAt);
    // Explicitly verify provider verification state
    assert.strictEqual(dataPaid.realPaymentProviderVerified, false);
    assert.ok(dataPaid.providerNotice.includes("REAL PAYMENT PROVIDER: NOT VERIFIED"));
  });

  test("Failure & Retry cycle: payout_initiated -> failed -> payable retry", async () => {
    // 1. Create payout
    const reqCreate = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_creator_fail_test",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 5500 }),
    });
    const resCreate = await handleMonetizationRequest(reqCreate);
    const { payout } = await resCreate.json();

    // 2. Advance to payout_initiated
    await handleMonetizationRequest(
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
    await handleMonetizationRequest(
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
    await handleMonetizationRequest(
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

    // 3. Mark as failed due to invalid bank routing
    const resFail = await handleMonetizationRequest(
      new Request("http://localhost:3000/api/monetization/payouts/transition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-user-id": "usr_admin",
          "x-test-role": "super_admin",
        },
        body: JSON.stringify({
          payoutId: payout.id,
          targetStatus: "failed",
          reason: "BANK_ROUTING_INVALID",
        }),
      }),
    );
    assert.strictEqual(resFail.status, 200);
    const dataFail = await resFail.json();
    assert.strictEqual(dataFail.payout.status, "failed");
    assert.strictEqual(dataFail.payout.failureReason, "BANK_ROUTING_INVALID");
    assert.strictEqual(dataFail.payout.retryCount, 1);

    // 4. Retry moves back to payable
    const resRetry = await handleMonetizationRequest(
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
    assert.strictEqual(resRetry.status, 200);
    const dataRetry = await resRetry.json();
    assert.strictEqual(dataRetry.payout.status, "payable");
  });

  test("Rejection restores creator available wallet balance", async () => {
    // 1. Check starting wallet balance for creator_reject_test
    const reqWallet1 = new Request("http://localhost:3000/api/monetization/wallet", {
      method: "GET",
      headers: {
        "x-test-user-id": "usr_creator_reject_test",
        "x-test-role": "creator",
      },
    });
    const resW1 = await handleMonetizationRequest(reqWallet1);
    const w1 = await resW1.json();
    const initialAvailable = w1.availableCents;

    // 2. Request payout of 5000 cents ($50.00)
    const reqCreate = new Request("http://localhost:3000/api/monetization/payouts/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": "usr_creator_reject_test",
        "x-test-role": "creator",
      },
      body: JSON.stringify({ amountCents: 5000 }),
    });
    const resCreate = await handleMonetizationRequest(reqCreate);
    const { payout, remainingBalanceCents } = await resCreate.json();
    assert.strictEqual(remainingBalanceCents, initialAvailable - 5000);

    // 3. Admin rejects the payout
    const resReject = await handleMonetizationRequest(
      new Request("http://localhost:3000/api/monetization/payouts/transition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-user-id": "usr_admin",
          "x-test-role": "super_admin",
        },
        body: JSON.stringify({
          payoutId: payout.id,
          targetStatus: "rejected",
          reason: "SUSPICIOUS_IDENTITY_INCONSISTENCY",
        }),
      }),
    );
    assert.strictEqual(resReject.status, 200);

    // 4. Wallet balance is restored
    const reqWallet2 = new Request("http://localhost:3000/api/monetization/wallet", {
      method: "GET",
      headers: {
        "x-test-user-id": "usr_creator_reject_test",
        "x-test-role": "creator",
      },
    });
    const resW2 = await handleMonetizationRequest(reqWallet2);
    const w2 = await resW2.json();
    assert.strictEqual(w2.availableCents, initialAvailable);
  });
});
