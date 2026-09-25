-- Production Monetization Ecosystem Phase 3
-- Authoritative schema for Creator Eligibility, Ad Revenue Sharing, Virtual Gifts,
-- Creator Subscriptions, Live Monetization, Performance Rewards, Brand Marketplace,
-- Affiliate Monetization, Creator Financial Wallet & Ledger, and Payout Lifecycle Engine.

-- 1. Creator Eligibility Table
CREATE TABLE IF NOT EXISTS public.monetization_eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status text NOT NULL DEFAULT 'eligible', -- 'eligible', 'in_review', 'restricted', 'suspended', 'not_eligible'
  followers_count int NOT NULL DEFAULT 0,
  account_age_days int NOT NULL DEFAULT 30,
  qualified_views_30d int NOT NULL DEFAULT 0,
  watch_time_minutes_30d int NOT NULL DEFAULT 0,
  community_strikes int NOT NULL DEFAULT 0,
  kyc_status text NOT NULL DEFAULT 'unverified', -- 'unverified', 'pending', 'verified', 'rejected'
  payment_verified boolean NOT NULL DEFAULT false,
  two_factor_verified boolean NOT NULL DEFAULT false,
  country_code text NOT NULL DEFAULT 'US',
  country_eligible boolean NOT NULL DEFAULT true,
  violations_count int NOT NULL DEFAULT 0,
  rejection_reason text,
  last_evaluated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS monetization_eligibility_user_idx ON public.monetization_eligibility (user_id);
GRANT SELECT, INSERT, UPDATE ON public.monetization_eligibility TO authenticated;
GRANT ALL ON public.monetization_eligibility TO service_role;
ALTER TABLE public.monetization_eligibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY monetization_eligibility_select_own ON public.monetization_eligibility
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY monetization_eligibility_insert_own ON public.monetization_eligibility
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY monetization_eligibility_update_own ON public.monetization_eligibility
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 2. Monetization Programs Configuration (Admin configurable revenue shares and rules)
CREATE TABLE IF NOT EXISTS public.monetization_programs_config (
  id text PRIMARY KEY,
  program_name text NOT NULL,
  creator_revenue_share_pct numeric(5,2) NOT NULL,
  platform_fee_pct numeric(5,2) NOT NULL,
  min_payout_cents int NOT NULL DEFAULT 5000,
  is_active boolean NOT NULL DEFAULT true,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.monetization_programs_config TO authenticated;
GRANT ALL ON public.monetization_programs_config TO service_role;
ALTER TABLE public.monetization_programs_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY monetization_programs_config_select_all ON public.monetization_programs_config
  FOR SELECT TO authenticated USING (true);

-- 3. Ad Revenue Events & Impression Tracking
CREATE TABLE IF NOT EXISTS public.ad_revenue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  content_type text NOT NULL, -- 'post', 'reel'
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  impression_type text NOT NULL, -- 'impression', 'qualified_view', 'engagement'
  watch_time_seconds int NOT NULL DEFAULT 0,
  advertiser_gross_cents int NOT NULL DEFAULT 0,
  creator_share_cents int NOT NULL DEFAULT 0,
  platform_fee_cents int NOT NULL DEFAULT 0,
  is_invalid_traffic boolean NOT NULL DEFAULT false,
  fraud_filter_reason text,
  status text NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'payable', 'paid'
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_revenue_creator_idx ON public.ad_revenue_events (creator_id, created_at DESC);
GRANT SELECT, INSERT ON public.ad_revenue_events TO authenticated;
GRANT ALL ON public.ad_revenue_events TO service_role;
ALTER TABLE public.ad_revenue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_revenue_select_own ON public.ad_revenue_events
  FOR SELECT TO authenticated USING (creator_id = auth.uid());

-- 4. User Coin Wallets (Virtual Currency)
CREATE TABLE IF NOT EXISTS public.user_coin_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_balance int NOT NULL DEFAULT 0,
  lifetime_purchased int NOT NULL DEFAULT 0,
  lifetime_spent int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_coin_wallets TO authenticated;
GRANT ALL ON public.user_coin_wallets TO service_role;
ALTER TABLE public.user_coin_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_coin_wallets_select_own ON public.user_coin_wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_coin_wallets_insert_own ON public.user_coin_wallets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY user_coin_wallets_update_own ON public.user_coin_wallets
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 5. Virtual Gifts Transactions
CREATE TABLE IF NOT EXISTS public.gift_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text,
  content_type text NOT NULL DEFAULT 'post', -- 'post', 'reel', 'live', 'profile'
  gift_id text NOT NULL,
  gift_name text NOT NULL,
  coin_amount int NOT NULL,
  creator_net_cents int NOT NULL,
  platform_fee_cents int NOT NULL,
  status text NOT NULL DEFAULT 'completed', -- 'completed', 'refunded', 'charged_back'
  anti_fraud_passed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gift_tx_recipient_idx ON public.gift_transactions (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS gift_tx_sender_idx ON public.gift_transactions (sender_id, created_at DESC);
GRANT SELECT, INSERT ON public.gift_transactions TO authenticated;
GRANT ALL ON public.gift_transactions TO service_role;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY gift_tx_select_parties ON public.gift_transactions
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY gift_tx_insert_own ON public.gift_transactions
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- 6. Creator Subscription Plans
CREATE TABLE IF NOT EXISTS public.creator_subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_name text NOT NULL DEFAULT 'Supporter',
  price_cents int NOT NULL DEFAULT 499,
  currency text NOT NULL DEFAULT 'USD',
  perks jsonb NOT NULL DEFAULT '["Exclusive Badges", "Subscriber-only Stories", "Priority DMs"]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_sub_plans_creator_idx ON public.creator_subscription_plans (creator_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_subscription_plans TO authenticated;
GRANT ALL ON public.creator_subscription_plans TO service_role;
ALTER TABLE public.creator_subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY creator_sub_plans_select_all ON public.creator_subscription_plans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY creator_sub_plans_manage_own ON public.creator_subscription_plans
  FOR ALL TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

-- 7. Live Monetization Events
CREATE TABLE IF NOT EXISTS public.live_monetization_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id text NOT NULL,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- 'gift', 'super_chat', 'badge'
  coin_amount int NOT NULL DEFAULT 0,
  gross_cents int NOT NULL DEFAULT 0,
  creator_net_cents int NOT NULL DEFAULT 0,
  platform_fee_cents int NOT NULL DEFAULT 0,
  message text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS live_monetization_creator_idx ON public.live_monetization_events (creator_id, created_at DESC);
GRANT SELECT, INSERT ON public.live_monetization_events TO authenticated;
GRANT ALL ON public.live_monetization_events TO service_role;
ALTER TABLE public.live_monetization_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_monetization_select ON public.live_monetization_events
  FOR SELECT TO authenticated USING (creator_id = auth.uid() OR sender_id = auth.uid());
CREATE POLICY live_monetization_insert ON public.live_monetization_events
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- 8. Performance Reward Campaigns & Participations
CREATE TABLE IF NOT EXISTS public.performance_reward_campaigns (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  target_metric text NOT NULL, -- 'qualified_views', 'reels_views', 'watch_minutes'
  milestone_threshold int NOT NULL,
  reward_cents int NOT NULL,
  max_cap_cents int NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.performance_reward_campaigns TO authenticated;
GRANT ALL ON public.performance_reward_campaigns TO service_role;
ALTER TABLE public.performance_reward_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY perf_campaigns_select_all ON public.performance_reward_campaigns
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.creator_campaign_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL REFERENCES public.performance_reward_campaigns(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_metric_value int NOT NULL DEFAULT 0,
  progress_pct numeric(5,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'milestone_reached', 'approved', 'paid'
  earned_cents int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);
CREATE INDEX IF NOT EXISTS creator_campaign_idx ON public.creator_campaign_participations (creator_id);
GRANT SELECT, INSERT, UPDATE ON public.creator_campaign_participations TO authenticated;
GRANT ALL ON public.creator_campaign_participations TO service_role;
ALTER TABLE public.creator_campaign_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY creator_campaign_select_own ON public.creator_campaign_participations
  FOR SELECT TO authenticated USING (creator_id = auth.uid());
CREATE POLICY creator_campaign_manage_own ON public.creator_campaign_participations
  FOR ALL TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

-- 9. Brand Campaigns & Creator Marketplace Contracts
CREATE TABLE IF NOT EXISTS public.brand_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  brand_logo text,
  title text NOT NULL,
  description text NOT NULL,
  budget_cents int NOT NULL,
  deliverables_required text NOT NULL,
  requirements_min_followers int NOT NULL DEFAULT 1000,
  status text NOT NULL DEFAULT 'open', -- 'open', 'contracted', 'closed'
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brand_campaigns TO authenticated;
GRANT ALL ON public.brand_campaigns TO service_role;
ALTER TABLE public.brand_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_campaigns_select_all ON public.brand_campaigns
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.creator_brand_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.brand_campaigns(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_text text NOT NULL,
  deliverable_content_url text,
  deliverable_post_id text,
  status text NOT NULL DEFAULT 'applied', -- 'applied', 'contracted', 'submitted', 'approved', 'paid', 'disputed'
  compensation_cents int NOT NULL,
  platform_fee_cents int NOT NULL,
  creator_net_cents int NOT NULL,
  disclosure_tag text NOT NULL DEFAULT '#sponsored',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brand_contracts_creator_idx ON public.creator_brand_contracts (creator_id);
GRANT SELECT, INSERT, UPDATE ON public.creator_brand_contracts TO authenticated;
GRANT ALL ON public.creator_brand_contracts TO service_role;
ALTER TABLE public.creator_brand_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_contracts_select_own ON public.creator_brand_contracts
  FOR SELECT TO authenticated USING (creator_id = auth.uid());
CREATE POLICY brand_contracts_insert_own ON public.creator_brand_contracts
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY brand_contracts_update_own ON public.creator_brand_contracts
  FOR UPDATE TO authenticated USING (creator_id = auth.uid());

-- 10. Affiliate Monetization & Conversions
CREATE TABLE IF NOT EXISTS public.affiliate_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  image_url text,
  category text NOT NULL DEFAULT 'Gear & Tech',
  price_cents int NOT NULL,
  commission_pct numeric(5,2) NOT NULL DEFAULT 10.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_products TO authenticated;
GRANT ALL ON public.affiliate_products TO service_role;
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliate_products_select_all ON public.affiliate_products
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.affiliate_products(id) ON DELETE CASCADE,
  custom_slug text NOT NULL UNIQUE,
  clicks_count int NOT NULL DEFAULT 0,
  conversions_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS affiliate_links_creator_idx ON public.affiliate_links (creator_id);
GRANT SELECT, INSERT, UPDATE ON public.affiliate_links TO authenticated;
GRANT ALL ON public.affiliate_links TO service_role;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliate_links_select_all ON public.affiliate_links
  FOR SELECT TO authenticated USING (true);
CREATE POLICY affiliate_links_manage_own ON public.affiliate_links
  FOR ALL TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.affiliate_products(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  order_value_cents int NOT NULL,
  commission_cents int NOT NULL,
  creator_net_cents int NOT NULL,
  platform_fee_cents int NOT NULL,
  status text NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'reversed', 'paid'
  return_window_ends_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS affiliate_conv_creator_idx ON public.affiliate_conversions (creator_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.affiliate_conversions TO authenticated;
GRANT ALL ON public.affiliate_conversions TO service_role;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliate_conv_select_own ON public.affiliate_conversions
  FOR SELECT TO authenticated USING (creator_id = auth.uid());

-- 11. Authoritative Creator Financial Wallets & Ledger
CREATE TABLE IF NOT EXISTS public.creator_financial_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_cents int NOT NULL DEFAULT 0,
  pending_cents int NOT NULL DEFAULT 0,
  approved_cents int NOT NULL DEFAULT 0,
  payable_cents int NOT NULL DEFAULT 0,
  total_paid_cents int NOT NULL DEFAULT 0,
  total_reversed_cents int NOT NULL DEFAULT 0,
  total_refunded_cents int NOT NULL DEFAULT 0,
  lifetime_gross_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.creator_financial_wallets TO authenticated;
GRANT ALL ON public.creator_financial_wallets TO service_role;
ALTER TABLE public.creator_financial_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY creator_wallet_select_own ON public.creator_financial_wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY creator_wallet_insert_own ON public.creator_financial_wallets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY creator_wallet_update_own ON public.creator_financial_wallets
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.transactions_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL, -- 'credit', 'debit', 'hold', 'release', 'payout', 'reversal', 'refund'
  source text NOT NULL, -- 'ad_revenue', 'virtual_gifts', 'subscriptions', 'live_stream', 'performance_reward', 'brand_marketplace', 'affiliate_commission', 'payout_withdrawal'
  gross_cents int NOT NULL,
  fee_cents int NOT NULL DEFAULT 0,
  net_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'payable', 'paid', 'reversed', 'refunded'
  related_entity_type text,
  related_entity_id text,
  description text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  audit_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ledger_user_idx ON public.transactions_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ledger_idempotency_idx ON public.transactions_ledger (idempotency_key);
GRANT SELECT, INSERT, UPDATE ON public.transactions_ledger TO authenticated;
GRANT ALL ON public.transactions_ledger TO service_role;
ALTER TABLE public.transactions_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY ledger_select_own ON public.transactions_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY ledger_insert_own ON public.transactions_ledger
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 12. Payout Lifecycle Requests & Payout Accounts
CREATE TABLE IF NOT EXISTS public.payout_account_configs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_type text NOT NULL DEFAULT 'monthly_15th', -- 'monthly_15th', 'monthly_end', 'biweekly', 'weekly', 'instant_vip'
  minimum_threshold_cents int NOT NULL DEFAULT 5000, -- $50.00
  payout_method text NOT NULL DEFAULT 'stripe_connect', -- 'stripe_connect', 'bank_wire', 'ach', 'upi', 'paypal'
  account_holder_name text,
  masked_account_number text,
  tax_id_type text NOT NULL DEFAULT 'w9', -- 'w9', 'w8ben', 'pan', 'vat'
  tax_id_last4 text,
  tax_form_status text NOT NULL DEFAULT 'not_submitted', -- 'not_submitted', 'pending_verification', 'verified', 'rejected'
  tax_verified_at timestamptz,
  legal_business_name text,
  country text NOT NULL DEFAULT 'US',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payout_account_configs TO authenticated;
GRANT ALL ON public.payout_account_configs TO service_role;
ALTER TABLE public.payout_account_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY payout_config_select_own ON public.payout_account_configs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY payout_config_manage_own ON public.payout_account_configs
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.payout_lifecycle_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending', -- 'earned', 'pending', 'in_review', 'approved', 'payable', 'payout_initiated', 'paid', 'failed', 'rejected', 'reversed', 'refund_adjustment'
  destination_type text NOT NULL,
  destination_summary text NOT NULL,
  payout_batch_id text,
  gateway_reference text,
  failure_reason text,
  retry_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS payout_lifecycle_user_idx ON public.payout_lifecycle_requests (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.payout_lifecycle_requests TO authenticated;
GRANT ALL ON public.payout_lifecycle_requests TO service_role;
ALTER TABLE public.payout_lifecycle_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY payout_lifecycle_select_own ON public.payout_lifecycle_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY payout_lifecycle_insert_own ON public.payout_lifecycle_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY payout_lifecycle_update_own ON public.payout_lifecycle_requests
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Seed initial default monetization program configurations
INSERT INTO public.monetization_programs_config (id, program_name, creator_revenue_share_pct, platform_fee_pct, min_payout_cents, rules)
VALUES 
  ('ad_revenue_share', 'In-Feed & Reels Ads', 60.00, 40.00, 5000, '{"min_watch_seconds": 3, "rpm_cents": 150}'::jsonb),
  ('virtual_gifts', 'Virtual Gifts & Badges', 80.00, 20.00, 5000, '{"coin_usd_rate": 0.01}'::jsonb),
  ('creator_subscriptions', 'Creator Subscriptions', 90.00, 10.00, 5000, '{"min_price_cents": 199, "max_price_cents": 4999}'::jsonb),
  ('live_monetization', 'Live Streaming Gifts', 75.00, 25.00, 5000, '{"realtime_settlement": true}'::jsonb),
  ('performance_rewards', 'Performance Bonus Programs', 100.00, 0.00, 5000, '{"monthly_bonus_cap_cents": 150000}'::jsonb),
  ('brand_marketplace', 'Brand Marketplace Partnerships', 85.00, 15.00, 5000, '{"escrow_required": true}'::jsonb),
  ('affiliate_monetization', 'Creator Affiliate Commerce', 90.00, 10.00, 5000, '{"return_hold_days": 14}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  updated_at = now();
