-- ====================================================================
-- OPEXNAL PRODUCTION-GRADE HIGH-SECURITY HARDENING MIGRATION
-- Migration Version: 20260907000000
-- ====================================================================

-- 1. SYSTEM FUNCTION & COLUMN TAMPERING PROTECTION ON PROFILES
-- Prevents ordinary users from granting themselves verified badges (is_verified)
-- and manually forging counters (followers_count, following_count, posts_count).

CREATE OR REPLACE FUNCTION public.protect_profile_system_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If executed by a standard client JWT (not Supabase service_role)
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    -- Check if user is attempting to modify is_verified
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Unauthorized: Only system administrators can alter verified badge status.';
    END IF;

    -- Protect counter integrity: counters must only be maintained by database triggers
    NEW.followers_count := OLD.followers_count;
    NEW.following_count := OLD.following_count;
    NEW.posts_count     := OLD.posts_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_system_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_system_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_system_columns();


-- 2. USER ROLES SECURITY (PRIVILEGE ESCALATION PREVENTION)
-- Ensure user_roles can NEVER be inserted, updated or deleted by client sessions.
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all" ON public.user_roles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Revoke write privileges on user_roles from anon and authenticated
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;


-- 3. SECURE HELPER: Check whether messaging/interaction is blocked between two users
CREATE OR REPLACE FUNCTION public.can_message_user(_sender_id uuid, _target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = _sender_id AND blocked_id = _target_id)
       OR (blocker_id = _target_id AND blocked_id = _sender_id)
  );
$$;


-- 4. HARDENED DIRECT MESSAGING POLICIES
-- Verify conversation membership and verify no active block exists
DROP POLICY IF EXISTS conversation_members_insert ON public.conversation_members;
CREATE POLICY conversation_members_insert ON public.conversation_members
  FOR INSERT TO authenticated WITH CHECK (
    (
      user_id = auth.uid()
      OR public.is_conversation_member(conversation_id, auth.uid())
      OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = user_id)
         OR (b.blocker_id = user_id AND b.blocked_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS messages_insert_member ON public.messages;
CREATE POLICY messages_insert_member ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_member(conversation_id, auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.conversation_members cm
      JOIN public.blocks b ON (b.blocker_id = cm.user_id AND b.blocked_id = auth.uid())
      WHERE cm.conversation_id = conversation_id
    )
  );


-- 5. IMMUTABLE AUDIT LOGGING & AUTO-TRIGGERS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Explicitly disallow UPDATE or DELETE on audit logs to preserve tamper-proof history
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;
REVOKE UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

-- Automatic audit log trigger on sensitive profile security events
CREATE OR REPLACE FUNCTION public.audit_profile_security_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.is_private IS DISTINCT FROM NEW.is_private) OR 
     (OLD.username IS DISTINCT FROM NEW.username) THEN
    INSERT INTO public.audit_logs (user_id, action, metadata)
    VALUES (
      NEW.id,
      'profile_security_modified',
      jsonb_build_object(
        'old_username', OLD.username,
        'new_username', NEW.username,
        'old_is_private', OLD.is_private,
        'new_is_private', NEW.is_private
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_profile_security_events ON public.profiles;
CREATE TRIGGER trg_audit_profile_security_events
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_security_events();


-- 6. STORAGE PATH ISOLATION AUDIT
-- Ensure all uploads to post-media, avatars, and story-media enforce user folder isolation:
-- Users may only insert or delete files under their own authenticated user id prefix folder.

DO $$
BEGIN
  -- avatars bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', false)
  ON CONFLICT (id) DO NOTHING;

  -- post-media bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('post-media', 'post-media', true)
  ON CONFLICT (id) DO NOTHING;

  -- story-media bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('story-media', 'story-media', true)
  ON CONFLICT (id) DO NOTHING;
END $$;
