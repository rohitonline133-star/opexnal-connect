-- Production Phase 2: Schema definitions for settings, notifications, verification, analytics, ledger, drafts, and realtime

-- 1. User Settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_select_own ON public.user_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_settings_insert_own ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY user_settings_update_own ON public.user_settings
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 2. In-App Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  entity_id text,
  entity_type text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notifications_insert_actor ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() OR auth.uid() IS NOT NULL);
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 3. Verification Applications table (Server-authoritative)
CREATE TABLE IF NOT EXISTS public.verification_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  known_as text NOT NULL,
  category text NOT NULL,
  document_type text NOT NULL,
  document_number text NOT NULL,
  official_links text[] NOT NULL DEFAULT '{}',
  notes text,
  status text NOT NULL DEFAULT 'PENDING',
  applied_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_notes text
);
CREATE INDEX IF NOT EXISTS verification_user_idx ON public.verification_applications (user_id);
GRANT SELECT, INSERT ON public.verification_applications TO authenticated;
GRANT ALL ON public.verification_applications TO service_role;
ALTER TABLE public.verification_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY verification_select_own ON public.verification_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY verification_insert_own ON public.verification_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 4. Creator Analytics table
CREATE TABLE IF NOT EXISTS public.creator_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  profile_visits int NOT NULL DEFAULT 0,
  impressions int NOT NULL DEFAULT 0,
  reach int NOT NULL DEFAULT 0,
  followers_delta int NOT NULL DEFAULT 0,
  engagement_count int NOT NULL DEFAULT 0,
  reel_views int NOT NULL DEFAULT 0,
  UNIQUE (user_id, record_date)
);
CREATE INDEX IF NOT EXISTS creator_analytics_user_date_idx ON public.creator_analytics (user_id, record_date DESC);
GRANT SELECT, INSERT, UPDATE ON public.creator_analytics TO authenticated;
GRANT ALL ON public.creator_analytics TO service_role;
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY creator_analytics_select_own ON public.creator_analytics
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY creator_analytics_upsert_own ON public.creator_analytics
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. Transaction Ledger table
CREATE TABLE IF NOT EXISTS public.transactions_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed',
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_ledger_user_idx ON public.transactions_ledger (user_id, created_at DESC);
GRANT SELECT ON public.transactions_ledger TO authenticated;
GRANT ALL ON public.transactions_ledger TO service_role;
ALTER TABLE public.transactions_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_select_own ON public.transactions_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 6. Post Drafts table
CREATE TABLE IF NOT EXISTS public.post_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  caption text,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  type text NOT NULL DEFAULT 'post',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS post_drafts_user_idx ON public.post_drafts (user_id, updated_at DESC);
GRANT ALL ON public.post_drafts TO authenticated;
GRANT ALL ON public.post_drafts TO service_role;
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_drafts_all_own ON public.post_drafts
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 7. Realtime Publications
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.posts,
      public.post_likes,
      public.post_comments,
      public.follows,
      public.follow_requests,
      public.messages,
      public.conversations,
      public.notifications,
      public.stories;
  EXCEPTION
    WHEN OTHERS THEN
      -- Publication may not exist or tables may already be members in some environments
      NULL;
  END;
END $$;
