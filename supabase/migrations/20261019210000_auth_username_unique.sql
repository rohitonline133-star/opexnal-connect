-- Enforce requested usernames rather than silently rewriting them to demo-like suffixes.
-- Existing profiles must be checked for case-insensitive duplicates before applying this migration.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_username TEXT;
BEGIN
  requested_username := lower(coalesce(NEW.raw_user_meta_data->>'username', ''));

  IF requested_username !~ '^[a-z0-9._]{3,30}$' THEN
    RAISE EXCEPTION 'Username must be 3-30 characters using lowercase letters, numbers, dots, or underscores';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = requested_username
  ) THEN
    RAISE EXCEPTION 'Username is already taken';
  END IF;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    requested_username,
    coalesce(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      requested_username
    )
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
