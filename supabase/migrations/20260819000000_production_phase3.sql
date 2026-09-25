-- Production Phase 3: Social graph restrictions, story replies, moderation cases & appeals,
-- verification reviews, creator subscriptions, payment methods, invoices, payouts, and account deletion lifecycle

-- 1. Account Restrictions table (Quiet protection without blocking)
CREATE TABLE IF NOT EXISTS public.restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restricted_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, restricted_user_id)
);
CREATE INDEX IF NOT EXISTS restrictions_user_idx ON public.restrictions (user_id);
CREATE INDEX IF NOT EXISTS restrictions_target_idx ON public.restrictions (restricted_user_id);
GRANT ALL ON public.restrictions TO authenticated;
GRANT ALL ON public.restrictions TO service_role;
ALTER TABLE public.restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY restrictions_select_own ON public.restrictions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY restrictions_insert_own ON public.restrictions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY restrictions_delete_own ON public.restrictions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 2. Story Replies table
CREATE TABLE IF NOT EXISTS public.story_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  reaction text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS story_replies_story_idx ON public.story_replies (story_id, created_at DESC);
CREATE INDEX IF NOT EXISTS story_replies_user_idx ON public.story_replies (user_id);
GRANT ALL ON public.story_replies TO authenticated;
GRANT ALL ON public.story_replies TO service_role;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY story_replies_select ON public.story_replies
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_replies.story_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY story_replies_insert ON public.story_replies
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 3. Moderation Cases table (Flag-not-delete review queue)
CREATE TABLE IF NOT EXISTS public.moderation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL, -- 'post', 'comment', 'story', 'profile', 'message'
  target_id text NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL, -- 'spam', 'phishing', 'harassment', 'hate_speech', 'dangerous'
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status text NOT NULL DEFAULT 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'APPEALED'
  rationale text,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS moderation_cases_status_idx ON public.moderation_cases (status, created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_cases_target_idx ON public.moderation_cases (target_type, target_id);
GRANT SELECT, INSERT ON public.moderation_cases TO authenticated;
GRANT ALL ON public.moderation_cases TO service_role;
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_cases_select_reporter ON public.moderation_cases
  FOR SELECT TO authenticated USING (
    reporter_id = auth.uid() OR public.has_role(auth.uid(), 'moderator')
  );
CREATE POLICY moderation_cases_insert ON public.moderation_cases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Appeals table (Contesting moderation decisions)
CREATE TABLE IF NOT EXISTS public.appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id text NOT NULL,
  target_type text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
  decision_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS appeals_user_idx ON public.appeals (user_id);
GRANT SELECT, INSERT ON public.appeals TO authenticated;
GRANT ALL ON public.appeals TO service_role;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY appeals_select_own ON public.appeals
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'moderator')
  );
CREATE POLICY appeals_insert_own ON public.appeals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 5. Verification Reviews table (Audit trail for blue badge decisions)
CREATE TABLE IF NOT EXISTS public.verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.verification_applications(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision text NOT NULL, -- 'APPROVED', 'REJECTED', 'REQUEST_INFO'
  rationale text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verification_reviews_app_idx ON public.verification_reviews (application_id);
GRANT SELECT ON public.verification_reviews TO authenticated;
GRANT ALL ON public.verification_reviews TO service_role;
ALTER TABLE public.verification_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY verification_reviews_select ON public.verification_reviews
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'moderator') OR
    EXISTS (
      SELECT 1 FROM public.verification_applications va
      WHERE va.id = verification_reviews.application_id AND va.user_id = auth.uid()
    )
  );

-- 6. Creator Earnings table
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gross_cents int NOT NULL DEFAULT 0,
  net_cents int NOT NULL DEFAULT 0,
  fee_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'accrued', -- 'accrued', 'paid_out', 'on_hold'
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_earnings_user_idx ON public.creator_earnings (user_id, period_start DESC);
GRANT SELECT ON public.creator_earnings TO authenticated;
GRANT ALL ON public.creator_earnings TO service_role;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY creator_earnings_select_own ON public.creator_earnings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 7. Subscriptions table (Fan subscriptions & Opexnal Plus)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL, -- 'fan_tier_1', 'fan_tier_2', 'opexnal_one', 'opexnal_plus'
  amount_cents int NOT NULL DEFAULT 499,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'cancelled', 'expired'
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_subscriber_idx ON public.subscriptions (subscriber_id);
CREATE INDEX IF NOT EXISTS subscriptions_creator_idx ON public.subscriptions (creator_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select_parties ON public.subscriptions
  FOR SELECT TO authenticated USING (
    subscriber_id = auth.uid() OR creator_id = auth.uid()
  );

-- 8. Payment Methods table (Server-authoritative tokenized storage)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe', -- 'stripe', 'razorpay'
  external_id text,
  type text NOT NULL DEFAULT 'card', -- 'card', 'upi', 'bank_account'
  brand text NOT NULL DEFAULT 'Visa',
  last4 text NOT NULL DEFAULT '4242',
  exp_month int,
  exp_year int,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_methods_user_idx ON public.payment_methods (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_methods_all_own ON public.payment_methods
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 9. Invoices & Receipts table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'paid', -- 'paid', 'open', 'void', 'uncollectible'
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_user_idx ON public.invoices (user_id, created_at DESC);
GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_select_own ON public.invoices
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 10. Payouts table (Strictly gated by live gateway)
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'blocked_no_gateway'
  provider_payout_id text,
  destination_last4 text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS payouts_user_idx ON public.payouts (user_id, created_at DESC);
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY payouts_select_own ON public.payouts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 11. Account Deletion Requests table (30-day grace period lifecycle)
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'COMPLETED', 'CANCELLED'
  scheduled_purge_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz
);
CREATE INDEX IF NOT EXISTS account_deletion_user_idx ON public.account_deletion_requests (user_id);
GRANT SELECT, INSERT, UPDATE ON public.account_deletion_requests TO authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_deletion_select_own ON public.account_deletion_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY account_deletion_insert_own ON public.account_deletion_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY account_deletion_update_own ON public.account_deletion_requests
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 12. Realtime Publications extension for Phase 3 tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.restrictions,
      public.story_replies,
      public.payouts,
      public.subscriptions;
  EXCEPTION
    WHEN OTHERS THEN
      -- Table may already be in publication or publication doesn't exist in local mock
      NULL;
  END;
END $$;
