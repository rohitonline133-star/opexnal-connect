CREATE TYPE public.story_audience AS ENUM ('public', 'followers', 'close_friends');

CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  media_type public.media_type NOT NULL,
  caption text NOT NULL DEFAULT '',
  width integer,
  height integer,
  duration_seconds numeric,
  audience public.story_audience NOT NULL DEFAULT 'followers',
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX stories_user_created_idx ON public.stories (user_id, created_at DESC);
CREATE INDEX stories_expires_idx ON public.stories (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, viewer_id)
);
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.story_author(_story_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.stories WHERE id = _story_id;
$$;

CREATE OR REPLACE FUNCTION public.can_view_story(_story_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = _story_id
      AND (
        s.user_id = auth.uid()
        OR (
          s.expires_at > now()
          AND public.can_view_author_content(s.user_id)
          AND (
            s.audience = 'public'
            OR EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.following_id = s.user_id)
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.mutes m
            WHERE m.muter_id = auth.uid() AND m.muted_id = s.user_id AND m.mute_stories
          )
        )
      )
  );
$$;

CREATE POLICY stories_insert_own ON public.stories
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY stories_update_own ON public.stories
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY stories_delete_own ON public.stories
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY stories_select_visible ON public.stories
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR (
      expires_at > now()
      AND public.can_view_author_content(user_id)
      AND (
        audience = 'public'
        OR EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.following_id = stories.user_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.mutes m
        WHERE m.muter_id = auth.uid() AND m.muted_id = stories.user_id AND m.mute_stories
      )
    )
  );

CREATE POLICY story_views_insert_own ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid() AND public.can_view_story(story_id));
CREATE POLICY story_views_select ON public.story_views
  FOR SELECT TO authenticated USING (viewer_id = auth.uid() OR public.story_author(story_id) = auth.uid());

CREATE POLICY content_reports_insert_own ON public.content_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY content_reports_select_own ON public.content_reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sync_story_views_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.stories SET views_count = views_count + 1 WHERE id = NEW.story_id;
  RETURN NULL;
END; $$;

CREATE TRIGGER story_views_counts AFTER INSERT ON public.story_views
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_views_count();

CREATE TRIGGER stories_set_updated_at BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER content_reports_set_updated_at BEFORE UPDATE ON public.content_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY story_media_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'story-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY story_media_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'story-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY story_media_select_visible ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'story-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.storage_path = storage.objects.name AND public.can_view_story(s.id)
      )
    )
  );