CREATE POLICY "post_media_upload_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "post_media_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "post_media_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "post_media_read_visible" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'post-media' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.post_media pm
        WHERE pm.storage_path = storage.objects.name AND public.can_view_post(pm.post_id)
      )
    )
  );

REVOKE EXECUTE ON FUNCTION public.can_view_author_content(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_view_post(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.post_author(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_view_author_content(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_author(uuid) TO authenticated;