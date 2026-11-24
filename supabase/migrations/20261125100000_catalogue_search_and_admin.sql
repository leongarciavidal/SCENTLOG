-- =============================================================================
-- SCENTLOG — Catalogue search + admin role for catalogue images
-- =============================================================================

create extension if not exists unaccent with schema extensions;

-- -----------------------------------------------------------------------------
-- Accent- and case-insensitive search text
-- -----------------------------------------------------------------------------
-- unaccent() is not marked immutable by Postgres (its dictionary could change),
-- so it cannot be used in an index directly. This wrapper pins the dictionary,
-- which is the documented way to make it indexable.
create or replace function public.normalize_search(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, '')));
$$;

grant execute on function public.normalize_search(text) to anon, authenticated, service_role;

-- "terre d'hermes hermes" — fragrance name + brand name, normalised.
alter table public.fragrances add column search_text text not null default '';

create or replace function public.fragrances_set_search_text()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text := public.normalize_search(
    new.name || ' ' || coalesce((select b.name from public.brands b where b.id = new.brand_id), '')
  );
  return new;
end;
$$;

create trigger fragrances_set_search_text
  before insert or update of name, brand_id on public.fragrances
  for each row execute function public.fragrances_set_search_text();

-- Renaming a brand refreshes the search text of all its fragrances.
create or replace function public.brands_refresh_search_text()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.fragrances set name = name where brand_id = new.id;
  return new;
end;
$$;

create trigger brands_refresh_search_text
  after update of name on public.brands
  for each row execute function public.brands_refresh_search_text();

-- Backfill existing rows (fires the trigger above).
update public.fragrances set name = name;

create index fragrances_search_text_trgm_idx on public.fragrances
  using gin (search_text extensions.gin_trgm_ops);

create index fragrances_release_year_idx on public.fragrances (release_year desc nulls last);
create index fragrances_name_idx on public.fragrances (name);

-- -----------------------------------------------------------------------------
-- Admins (can manage catalogue images from the app)
-- -----------------------------------------------------------------------------
-- Not in the column grants for `authenticated`, so users cannot make
-- themselves admin. Set it from the Supabase SQL editor.
alter table public.profiles add column is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

-- Admins may change a fragrance's image and its credit — nothing else.
grant update (image_url, image_credit) on public.fragrances to authenticated;

create policy "Admins update fragrance images" on public.fragrances
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Storage: only admins write to the fragrance-images bucket.
create policy "Admins upload fragrance images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'fragrance-images' and (select public.is_admin()));

create policy "Admins update fragrance images"
  on storage.objects for update to authenticated
  using (bucket_id = 'fragrance-images' and (select public.is_admin()))
  with check (bucket_id = 'fragrance-images' and (select public.is_admin()));

create policy "Admins delete fragrance images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'fragrance-images' and (select public.is_admin()));

create policy "Admins list fragrance images"
  on storage.objects for select to authenticated
  using (bucket_id = 'fragrance-images' and (select public.is_admin()));
