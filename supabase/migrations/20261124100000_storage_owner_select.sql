-- =============================================================================
-- SCENTLOG — Let users list their own uploaded files
-- -----------------------------------------------------------------------------
-- Public buckets already serve files by URL. Listing files and deleting them
-- through the API additionally requires SELECT on storage.objects; this policy
-- grants it only for files inside the user's own folder.
-- =============================================================================

create policy "Users list files in their own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('avatars', 'list-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
