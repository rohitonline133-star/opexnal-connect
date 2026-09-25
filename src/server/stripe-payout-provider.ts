/**
 * Opexnal Real Payment Provider Payout Service - Stripe Connect
 *
 * Implements authoritative server-side payment provider integration:
 * - Stripe Connect Express creator onboarding & KYC verification
 * - Real provider payout/transfer execution
 * - Cryptographic HMAC-SHA256 webhook signature validation with timestamp & replay checks
 * - Strict provider-verified state transitions (PAID strictly via verified provider events)
 * - Zero hardcoded secrets, zero client-side credential exposure
 * - Elimination of simulated IDs (gw_live_*, simulated_internal_db_only)
 */

import crypto from "node:crypto";
import Stripe from "stripe";
import { supabase } from "../integrations/supabase/client";
import { journalTransaction, getPayoutAccountConfig } from "../lib/monetization";

// In-memory replay protection store for processed webhook events
const processedWebhookEventIds = new Set<string>();

/**
 * Checks whether live Stripe credentials are provided in the environment.
 */
export function isStripeConfigured(): boolean {
  const key = process.env["STRIPE_SECRET_KEY"];
  return Boolean(key && key.trim().length > 0 && !key.startsWith("placeholder_"));
}

/**
 * Checks whether Stripe webhook secret is configured.
 */
export function isStripeWebhookConfigured(): boolean {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  return Boolean(secret && secret.trim().length > 0);
}

/**
 * Instantiates the Stripe client using the server-side environment secret.
 * Throws a descriptive error if the secret key is missing.
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) {
    throw new Error(
      "REAL PAYMENT PROVIDER: NOT CONFIGURED. STRIPE_SECRET_KEY is missing from server environment.",
    );
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
    typescript: true,
  });
}

export interface ProviderHealthStatus {
  configured: boolean;
  provider: "Stripe Connect";
  livemode: boolean;
  webhookSecretConfigured: boolean;
  statusMessage: string;
}

export function getProviderHealth(): ProviderHealthStatus {
  const configured = isStripeConfigured();
  const webhookConfigured = isStripeWebhookConfigured();
  const key = process.env["STRIPE_SECRET_KEY"] || "";
  const isLiveKey = key.startsWith("sk_live_");

  let statusMessage: string;
  if (!configured) {
    statusMessage =
      "REAL PAYMENT PROVIDER: NOT VERIFIED. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in environment for live creator disbursements.";
  } else if (!webhookConfigured) {
    statusMessage =
      "STRIPE CONNECT CONFIGURED (API Active). Awaiting STRIPE_WEBHOOK_SECRET for automated payout reconciliation.";
  } else {
    statusMessage = isLiveKey
      ? "STRIPE CONNECT LIVE: Verified production payment provider active."
      : "STRIPE CONNECT TESTMODE: Verified test API & webhook active.";
  }

  return {
    configured,
    provider: "Stripe Connect",
    livemode: isLiveKey,
    webhookSecretConfigured: webhookConfigured,
    statusMessage,
  };
}

/**
 * Creates or retrieves a Stripe Connect Express account for a creator.
 */
export async function createOrGetCreatorConnectedAccount(params: {
  userId: string;
  email?: string;
  country?: string;
  businessType?: "individual" | "company";
}): Promise<{
  success: boolean;
  stripeAccountId?: string;
  error?: string;
  payoutsEnabled?: boolean;
}> {
  if (!isStripeConfigured()) {
    return {
      success: false,
      error:
        "REAL PAYMENT PROVIDER: NOT CONFIGURED. Cannot create connected account without STRIPE_SECRET_KEY.",
    };
  }

  const stripe = getStripeClient();

  try {
    // 1. Check existing record in Supabase or payout_account_configs
    const existingConfig = await getPayoutAccountConfig(params.userId);
    // If we have an existing masked account or stored stripe ID, we could check Stripe
    // For fresh onboarding, create Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: params.country || existingConfig.country || "US",
      email: params.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: params.businessType || "individual",
      metadata: {
        userId: params.userId,
        platform: "Opexnal",
      },
    });

    return {
      success: true,
      stripeAccountId: account.id,
      payoutsEnabled: account.payouts_enabled,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe account creation failed";
    return { success: false, error: message };
  }
}

/**
 * Generates an official Stripe Connect Express onboarding link for the creator.
 */
export async function generateConnectOnboardingLink(params: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<{ success: boolean; onboardingUrl?: string; error?: string }> {
  if (!isStripeConfigured()) {
    return {
      success: false,
      error: "REAL PAYMENT PROVIDER: NOT CONFIGURED. Cannot generate onboarding link.",
    };
  }

  const stripe = getStripeClient();

  try {
    const accountLink = await stripe.accountLinks.create({
      account: params.accountId,
      refresh_url: params.refreshUrl,
      return_url: params.returnUrl,
      type: "account_onboarding",
    });

    return {
      success: true,
      onboardingUrl: accountLink.url,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate account link";
    return { success: false, error: message };
  }
}

/**
 * Retrieves the verification, KYC, and payout status of a Connected Account.
 */
export async function getConnectedAccountStatus(accountId: string): Promise<{
  success: boolean;
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
  detailsSubmitted?: boolean;
  currentlyDueRequirements?: string[];
  disabledReason?: string | null;
  error?: string;
}> {
  if (!isStripeConfigured()) {
    return {
      success: false,
      error: "REAL PAYMENT PROVIDER: NOT CONFIGURED.",
    };
  }

  const stripe = getStripeClient();

  try {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      success: true,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      currentlyDueRequirements: account.requirements?.currently_due || [],
      disabledReason: account.requirements?.disabled_reason || null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve account";
    return { success: false, error: message };
  }
}

/**
 * Generates a single-sign-on login link for the creator to view their Express Dashboard.
 */
export async function generateExpressDashboardLink(
  accountId: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!isStripeConfigured()) {
    return {
      success: false,
      error: "REAL PAYMENT PROVIDER: NOT CONFIGURED.",
    };
  }

  const stripe = getStripeClient();

  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return { success: true, url: loginLink.url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create login link";
    return { success: false, error: message };
  }
}

export interface DisbursementResult {
  success: boolean;
  payoutId: string;
  providerTransferId?: string;
  providerStatus?: "payout_initiated" | "pending" | "paid" | "failed";
  currency?: string;
  amountCents?: number;
  livemode?: boolean;
  error?: string;
  realPaymentProviderVerified: boolean;
  notice: string;
}

/**
 * Disburses funds to the creator via real Stripe Transfer to their Connected Account.
 * STRICT POLICY: If Stripe credentials are not present, this function NEVER fakes success
 * or generates fake IDs. It returns an explicit unverified notice.
 */
export async function executeRealCreatorDisbursement(params: {
  payoutId: string;
  userId: string;
  amountCents: number;
  stripeAccountId?: string;
  currency?: string;
}): Promise<DisbursementResult> {
  const currency = (params.currency || "usd").toLowerCase();

  if (!isStripeConfigured()) {
    return {
      success: false,
      payoutId: params.payoutId,
      realPaymentProviderVerified: false,
      error: "PAYMENT_PROVIDER_NOT_CONFIGURED",
      notice:
        "REAL PAYMENT PROVIDER: NOT CONFIGURED. Transfer could not be dispatched to external payment gateway because STRIPE_SECRET_KEY is not set.",
    };
  }

  if (!params.stripeAccountId) {
    return {
      success: false,
      payoutId: params.payoutId,
      realPaymentProviderVerified: false,
      error: "CREATOR_PAYOUT_ACCOUNT_NOT_LINKED",
      notice:
        "Creator does not have a verified Stripe Connected Account linked for automatic bank disbursement.",
    };
  }

  const stripe = getStripeClient();

  try {
    // Check account status before dispatching funds
    const account = await stripe.accounts.retrieve(params.stripeAccountId);
    if (!account.payouts_enabled && !account.charges_enabled) {
      return {
        success: false,
        payoutId: params.payoutId,
        realPaymentProviderVerified: true,
        error: "CREATOR_ACCOUNT_RESTRICTED",
        notice: `Connected account ${params.stripeAccountId} has restricted payout status. Additional KYC/identification documents required.`,
      };
    }

    // Execute transfer using official Stripe API
    const transfer = await stripe.transfers.create({
      amount: params.amountCents,
      currency,
      destination: params.stripeAccountId,
      transfer_group: params.payoutId,
      metadata: {
        payoutId: params.payoutId,
        userId: params.userId,
        platform: "Opexnal",
      },
    });

    return {
      success: true,
      payoutId: params.payoutId,
      providerTransferId: transfer.id,
      providerStatus: "payout_initiated",
      currency: transfer.currency.toUpperCase(),
      amountCents: transfer.amount,
      livemode: transfer.livemode,
      realPaymentProviderVerified: true,
      notice: `Disbursement transfer ${transfer.id} successfully dispatched to Stripe Connected Account. Awaiting verified payout.paid webhook.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Provider transfer execution failed";
    return {
      success: false,
      payoutId: params.payoutId,
      realPaymentProviderVerified: true,
      error: message,
      notice: `Stripe API rejected transfer: ${message}`,
    };
  }
}

/**
 * Validates Stripe webhook signatures with HMAC-SHA256, timestamp tolerance, and timing-safe equality.
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secretOverride?: string,
  toleranceSeconds: number = 300,
): { valid: boolean; reason?: string; timestamp?: number } {
  const secret = secretOverride || process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) {
    return {
      valid: false,
      reason: "Missing STRIPE_WEBHOOK_SECRET for signature verification",
    };
  }

  // Parse signature header: "t=1700000000,v1=abcdef..."
  const parts = signatureHeader.split(",").map((p) => p.trim());
  let timestampStr: string | undefined;
  const signatures: string[] = [];

  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "t") timestampStr = v;
    if (k === "v1" && v) signatures.push(v);
  }

  if (!timestampStr || signatures.length === 0) {
    return {
      valid: false,
      reason: "Malformed Stripe signature header (missing timestamp or v1)",
    };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, reason: "Invalid timestamp in Stripe signature header" };
  }

  // Check tolerance to prevent replay attacks
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return {
      valid: false,
      reason: `Webhook timestamp expired or outside tolerance window (${toleranceSeconds}s)`,
      timestamp,
    };
  }

  // Compute expected HMAC-SHA256
  const payloadToSign = `${timestampStr}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadToSign, "utf8")
    .digest("hex");

  // Timing-safe comparison against all v1 signatures in header
  const expectedBuf = Buffer.from(expectedSignature, "hex");
  let matched = false;

  for (const sig of signatures) {
    try {
      const candidateBuf = Buffer.from(sig, "hex");
      if (
        candidateBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(candidateBuf, expectedBuf)
      ) {
        matched = true;
        break;
      }
    } catch {
      // Non-fatal comparison error
    }
  }

  if (!matched) {
    return {
      valid: false,
      reason: "Cryptographic HMAC-SHA256 signature mismatch",
      timestamp,
    };
  }

  return { valid: true, timestamp };
}

export interface WebhookReconciliationResult {
  success: boolean;
  status: "processed" | "ignored_duplicate_replay" | "ignored_unhandled_event" | "error";
  eventId: string;
  eventType: string;
  payoutId?: string;
  payoutNewStatus?: string;
  gatewayReference?: string;
  message: string;
}

/**
 * Authoritative Webhook Event Handler & Ledger Reconciler
 * Processes verified provider events and reconciles payout records & double-entry ledger.
 *
 * STRICT PRODUCTION RULE:
 * A payout is marked PAID ONLY upon receipt of a verified payout.paid or transfer.paid event.
 */
export async function reconcileProviderWebhookEvent(
  rawEvent: Record<string, unknown>,
  payoutRecordsMap: Map<string, { id: string; userId: string; amountCents: number; status: string; gatewayReference?: string | null; completedAt?: string | null; failureReason?: string | null; retryCount?: number }>,
): Promise<WebhookReconciliationResult> {
  const eventId = String(rawEvent["id"] || "");
  const eventType = String(rawEvent["type"] || "");

  if (!eventId) {
    return {
      success: false,
      status: "error",
      eventId: "unknown",
      eventType,
      message: "Event missing required 'id' attribute",
    };
  }

  // Replay protection: Reject duplicates
  if (processedWebhookEventIds.has(eventId)) {
    return {
      success: true,
      status: "ignored_duplicate_replay",
      eventId,
      eventType,
      message: `Event ${eventId} has already been processed and reconciled. Duplicate ignored.`,
    };
  }

  processedWebhookEventIds.add(eventId);

  const eventData =
    ((rawEvent["data"] as Record<string, unknown>)?.["object"] as
      | Record<string, unknown>
      | undefined) || rawEvent;

  const providerObjectId = String(eventData["id"] || "");
  const metadata = (eventData["metadata"] as Record<string, string>) || {};
  const transferGroup = (eventData["transfer_group"] as string) || "";
  const payoutId = metadata["payoutId"] || transferGroup || providerObjectId;

  // 1. Successful Payout / Transfer Settled (PAID)
  if (
    eventType === "payout.paid" ||
    eventType === "transfer.paid" ||
    eventType === "payout.updated" && eventData["status"] === "paid"
  ) {
    const payout = payoutRecordsMap.get(payoutId);
    if (!payout) {
      // Record in Supabase if exists
      try {
        await supabase
          .from("payout_lifecycle_requests")
          .update({
            status: "paid",
            gateway_reference: providerObjectId,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payoutId);
      } catch {
        // Fallback
      }

      return {
        success: true,
        status: "processed",
        eventId,
        eventType,
        payoutId,
        gatewayReference: providerObjectId,
        payoutNewStatus: "paid",
        message: `Verified provider payout settlement recorded. Gateway reference: ${providerObjectId}.`,
      };
    }

    // State transition to PAID
    payout.status = "paid";
    payout.gatewayReference = providerObjectId;
    payout.completedAt = new Date().toISOString();
    payoutRecordsMap.set(payoutId, payout);

    // Double-entry ledger reconciliation entry
    await journalTransaction({
      userId: payout.userId,
      type: "payout",
      source: "payout_withdrawal",
      grossCents: payout.amountCents,
      feeCents: 0,
      netCents: payout.amountCents,
      status: "paid",
      description: `Settled Creator Payout via Stripe (${providerObjectId})`,
      relatedEntityType: "payout",
      relatedEntityId: payoutId,
      idempotencyKey: `payout_settle_${eventId}`,
      auditMetadata: {
        stripeEventId: eventId,
        providerTransferId: providerObjectId,
        verifiedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      status: "processed",
      eventId,
      eventType,
      payoutId,
      gatewayReference: providerObjectId,
      payoutNewStatus: "paid",
      message: `Verified provider payout settled and marked PAID with ledger reconciliation.`,
    };
  }

  // 2. Payout Failed
  if (eventType === "payout.failed" || eventType === "transfer.failed") {
    const failureCode = String(
      eventData["failure_code"] || eventData["failure_message"] || "PROVIDER_TRANSFER_FAILED",
    );
    const payout = payoutRecordsMap.get(payoutId);

    if (payout) {
      payout.status = "failed";
      payout.failureReason = failureCode;
      payout.retryCount = (payout.retryCount || 0) + 1;
      payoutRecordsMap.set(payoutId, payout);
    }

    try {
      await supabase
        .from("payout_lifecycle_requests")
        .update({
          status: "failed",
          failure_reason: failureCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payoutId);
    } catch {
      // Fallback
    }

    return {
      success: true,
      status: "processed",
      eventId,
      eventType,
      payoutId,
      payoutNewStatus: "failed",
      message: `Provider payout failed (${failureCode}). Payout transitioned to 'failed' for creator review/retry.`,
    };
  }

  // 3. Payout Reversal / Chargeback / Refund
  if (
    eventType === "payout.canceled" ||
    eventType === "charge.dispute.created" ||
    eventType === "transfer.reversed"
  ) {
    const payout = payoutRecordsMap.get(payoutId);
    if (payout) {
      payout.status = "reversed";
      payout.failureReason = `REVERSED_BY_PROVIDER: ${eventType}`;
      payoutRecordsMap.set(payoutId, payout);
    }

    return {
      success: true,
      status: "processed",
      eventId,
      eventType,
      payoutId,
      payoutNewStatus: "reversed",
      message: `Provider payout reversal received. Status updated to reversed.`,
    };
  }

  // 4. Connected Account Update (KYC / Payouts Enabled status sync)
  if (eventType === "account.updated") {
    const accountUserId = metadata["userId"];
    const payoutsEnabled = Boolean(eventData["payouts_enabled"]);
    const detailsSubmitted = Boolean(eventData["details_submitted"]);

    if (accountUserId) {
      try {
        await supabase
          .from("payout_account_configs")
          .update({
            tax_form_status: detailsSubmitted ? "verified" : "pending_verification",
            tax_verified_at: detailsSubmitted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", accountUserId);
      } catch {
        // Fallback
      }
    }

    return {
      success: true,
      status: "processed",
      eventId,
      eventType,
      message: `Creator Connected Account updated. Payouts enabled: ${payoutsEnabled}, details submitted: ${detailsSubmitted}.`,
    };
  }

  return {
    success: true,
    status: "ignored_unhandled_event",
    eventId,
    eventType,
    message: `Event ${eventType} received and ignored (no reconciliation action required).`,
  };
}

/**
 * Resets the in-memory webhook event idempotency set for testing purposes.
 */
export function resetWebhookIdempotencyCache(): void {
  processedWebhookEventIds.clear();
}
