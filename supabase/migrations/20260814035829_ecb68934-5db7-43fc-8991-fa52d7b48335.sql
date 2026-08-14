-- helper: can current user see content authored by _author
CREATE OR REPLACE FUNCTION public.can_view_author_content(_author uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN auth.uid() = _author THEN true
    WHEN EXISTS (SELECT 1 FROM public.blocks b WHERE (b.blocker_id = _author AND b.blocked_id = auth.uid()) OR (b.blocker_id = auth.uid() AND b.blocked_id = _author)) THEN false
    WHEN EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _author AND p.is_private = false) THEN true
    ELSE EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.following_id = _author)
  END;
$$;

CREATE TYPE public.post_visibility AS ENUM ('public','followers','private');
CREATE TYPE public.media_type AS ENUM ('image','video');

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption text NOT NULL DEFAULT '',
  visibility public.post_visibility NOT NULL DEFAULT 'public',
  location_name text,
  location_lat double precision,
  location_lng double precision,
  comments_enabled boolean NOT NULL DEFAULT true,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  saves_count integer NOT NULL DEFAULT 0,
  shares_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_select_visible ON public.posts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (visibility <> 'private' AND public.can_view_author_content(user_id)));
CREATE POLICY posts_insert_own ON public.posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY posts_update_own ON public.posts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY posts_delete_own ON public.posts FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX posts_user_created_idx ON public.posts (user_id, created_at DESC);
CREATE INDEX posts_created_idx ON public.posts (created_at DESC);
CREATE TRIGGER posts_set_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_view_post(_post_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = _post_id
      AND (p.user_id = auth.uid() OR (p.visibility <> 'private' AND public.can_view_author_content(p.user_id)))
  );
$$;

CREATE OR REPLACE FUNCTION public.post_author(_post_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.posts WHERE id = _post_id;
$$;

CREATE TABLE public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  media_type public.media_type NOT NULL,
  width integer,
  height integer,
  duration_seconds numeric,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_media TO authenticated;
GRANT ALL ON public.post_media TO service_role;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_media_select ON public.post_media FOR SELECT TO authenticated USING (public.can_view_post(post_id));
CREATE POLICY post_media_insert_own ON public.post_media FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.post_author(post_id) = auth.uid());
CREATE POLICY post_media_delete_own ON public.post_media FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX post_media_post_idx ON public.post_media (post_id, position);

CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_likes_select ON public.post_likes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.post_author(post_id) = auth.uid());
CREATE POLICY post_likes_insert_own ON public.post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.can_view_post(post_id));
CREATE POLICY post_likes_delete_own ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_saves TO authenticated;
GRANT ALL ON public.post_saves TO service_role;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_saves_own ON public.post_saves FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY post_saves_insert_own ON public.post_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.can_view_post(post_id));
CREATE POLICY post_saves_delete_own ON public.post_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'link',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.post_shares TO authenticated;
GRANT ALL ON public.post_shares TO service_role;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_shares_select_own ON public.post_shares FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.post_author(post_id) = auth.uid());
CREATE POLICY post_shares_insert_own ON public.post_shares FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.can_view_post(post_id));

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_comments_select ON public.post_comments FOR SELECT TO authenticated USING (public.can_view_post(post_id));
CREATE POLICY post_comments_insert ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_view_post(post_id) AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.comments_enabled));
CREATE POLICY post_comments_update_own ON public.post_comments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY post_comments_delete ON public.post_comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.post_author(post_id) = auth.uid());
CREATE INDEX post_comments_post_idx ON public.post_comments (post_id, created_at);
CREATE TRIGGER post_comments_set_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY comment_likes_select_own ON public.comment_likes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY comment_likes_insert_own ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY comment_likes_delete_own ON public.comment_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text NOT NULL UNIQUE,
  posts_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hashtags TO authenticated;
GRANT ALL ON public.hashtags TO service_role;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY hashtags_select ON public.hashtags FOR SELECT TO authenticated USING (true);

CREATE TABLE public.post_hashtags (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, hashtag_id)
);
GRANT SELECT ON public.post_hashtags TO authenticated;
GRANT ALL ON public.post_hashtags TO service_role;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_hashtags_select ON public.post_hashtags FOR SELECT TO authenticated USING (public.can_view_post(post_id));

-- counters
CREATE OR REPLACE FUNCTION public.sync_post_counts() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _delta int; _post uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN _delta := 1; ELSE _delta := -1; END IF;
  IF TG_TABLE_NAME = 'comment_likes' THEN
    UPDATE public.post_comments SET likes_count = greatest(likes_count + _delta, 0)
      WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
    RETURN NULL;
  END IF;
  _post := COALESCE(NEW.post_id, OLD.post_id);
  IF TG_TABLE_NAME = 'post_likes' THEN
    UPDATE public.posts SET likes_count = greatest(likes_count + _delta, 0) WHERE id = _post;
  ELSIF TG_TABLE_NAME = 'post_saves' THEN
    UPDATE public.posts SET saves_count = greatest(saves_count + _delta, 0) WHERE id = _post;
  ELSIF TG_TABLE_NAME = 'post_shares' THEN
    UPDATE public.posts SET shares_count = greatest(shares_count + _delta, 0) WHERE id = _post;
  ELSIF TG_TABLE_NAME = 'post_comments' THEN
    UPDATE public.posts SET comments_count = greatest(comments_count + _delta, 0) WHERE id = _post;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER post_likes_counts AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.sync_post_counts();
CREATE TRIGGER post_saves_counts AFTER INSERT OR DELETE ON public.post_saves FOR EACH ROW EXECUTE FUNCTION public.sync_post_counts();
CREATE TRIGGER post_shares_counts AFTER INSERT OR DELETE ON public.post_shares FOR EACH ROW EXECUTE FUNCTION public.sync_post_counts();
CREATE TRIGGER post_comments_counts AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.sync_post_counts();
CREATE TRIGGER comment_likes_counts AFTER INSERT OR DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.sync_post_counts();

CREATE OR REPLACE FUNCTION public.sync_profile_posts_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  ELSE
    UPDATE public.profiles SET posts_count = greatest(posts_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER posts_profile_counts AFTER INSERT OR DELETE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.sync_profile_posts_count();

-- hashtag extraction from caption
CREATE OR REPLACE FUNCTION public.sync_post_hashtags() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tag text; _id uuid;
BEGIN
  DELETE FROM public.post_hashtags WHERE post_id = NEW.id;
  FOR _tag IN
    SELECT DISTINCT lower(m[1]) FROM regexp_matches(COALESCE(NEW.caption,''), '#([A-Za-z0-9_]{1,50})', 'g') AS m
  LOOP
    INSERT INTO public.hashtags (tag) VALUES (_tag)
      ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag
      RETURNING id INTO _id;
    INSERT INTO public.post_hashtags (post_id, hashtag_id) VALUES (NEW.id, _id) ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NULL;
END; $$;
CREATE TRIGGER posts_sync_hashtags AFTER INSERT OR UPDATE OF caption ON public.posts FOR EACH ROW EXECUTE FUNCTION public.sync_post_hashtags();