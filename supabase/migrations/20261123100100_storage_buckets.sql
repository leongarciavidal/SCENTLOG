-- =============================================================================
-- SCENTLOG — Storage buckets and policies
-- -----------------------------------------------------------------------------
-- avatars           public read; each user writes only inside "<their uid>/"
-- list-covers       public read; each user writes only inside "<their uid>/"
-- fragrance-images  public read; written only with the secret key (admin)
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('list-covers', 'list-covers', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('fragrance-images', 'fragrance-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Users manage files only inside a folder named after their own user id,
-- e.g. avatars/2f1c…/avatar.webp
create policy "Users upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'list-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users update files in their own folder"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars', 'list-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('avatars', 'list-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users delete files in their own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'list-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
