CREATE OR REPLACE FUNCTION public.accept_follow_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _requester uuid;
  _target uuid;
BEGIN
  SELECT requester_id, target_id INTO _requester, _target
  FROM public.follow_requests
  WHERE id = _request_id;

  IF _target IS NULL OR _target <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to accept this request';
  END IF;

  INSERT INTO public.follows (follower_id, following_id)
  VALUES (_requester, _target)
  ON CONFLICT DO NOTHING;

  DELETE FROM public.follow_requests WHERE id = _request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_follow_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_follow_request(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_follow(_target_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _private boolean;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _me = _target_id THEN
    RAISE EXCEPTION 'You cannot follow yourself';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = _me AND blocked_id = _target_id)
       OR (blocker_id = _target_id AND blocked_id = _me)
  ) THEN
    RAISE EXCEPTION 'This action is not available';
  END IF;

  SELECT is_private INTO _private FROM public.profiles WHERE id = _target_id;
  IF _private IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF _private THEN
    INSERT INTO public.follow_requests (requester_id, target_id)
    VALUES (_me, _target_id)
    ON CONFLICT DO NOTHING;
    RETURN 'requested';
  END IF;

  INSERT INTO public.follows (follower_id, following_id)
  VALUES (_me, _target_id)
  ON CONFLICT DO NOTHING;
  RETURN 'following';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_follow(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_follow(uuid) TO authenticated, service_role;