-- =============================================================================
-- Catalogue search text + admin-only image management
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-1111-1111-1111-111111111111', 'admin@example.com', '{"username":"curator"}'),
  ('bbbbbbbb-2222-2222-2222-222222222222', 'user@example.com',  '{"username":"regular"}');
update public.profiles set is_admin = true where id = 'aaaaaaaa-1111-1111-1111-111111111111';

insert into public.brands (id, slug, name) values
  ('cccccccc-0000-0000-0000-000000000001', 'maison-ete', 'Maison Été');
insert into public.fragrances (id, slug, brand_id, name, concentration) values
  ('dddddddd-0000-0000-0000-000000000001', 'maison-ete-reverie', 'cccccccc-0000-0000-0000-000000000001', 'Rêverie d''Ambre', 'edp');

select is(
  (select search_text from public.fragrances where id = 'dddddddd-0000-0000-0000-000000000001'),
  'reverie d''ambre maison ete', 'search text is lower-case, accent-free and includes the brand');

update public.brands set name = 'Maison Hiver' where id = 'cccccccc-0000-0000-0000-000000000001';
select is(
  (select search_text from public.fragrances where id = 'dddddddd-0000-0000-0000-000000000001'),
  'reverie d''ambre maison hiver', 'renaming a brand refreshes its fragrances');

select is(
  (select count(*)::int from public.fragrances where search_text like '%' || public.normalize_search('RÊVERIE') || '%'),
  1, 'normalised queries match regardless of accents and case');

-- Regular user ----------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-2222-2222-2222-222222222222","role":"authenticated"}';

select is(public.is_admin(), false, 'regular user is not an admin');
select throws_ok(
  $$ update public.profiles set is_admin = true where id = 'bbbbbbbb-2222-2222-2222-222222222222' $$,
  '42501', null, 'users cannot make themselves admin');
update public.fragrances set image_url = 'https://evil.example/x.jpg'
  where id = 'dddddddd-0000-0000-0000-000000000001';
select throws_ok(
  $$ update public.fragrances set name = 'Hacked' where id = 'dddddddd-0000-0000-0000-000000000001' $$,
  '42501', null, 'users cannot edit catalogue text');

-- Admin -------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"aaaaaaaa-1111-1111-1111-111111111111","role":"authenticated"}';

select is(public.is_admin(), true, 'admin is recognised');
select lives_ok(
  $$ update public.fragrances
     set image_url = 'https://example.supabase.co/storage/v1/object/public/fragrance-images/x.webp',
         image_credit = 'Photo: SCENTLOG'
     where id = 'dddddddd-0000-0000-0000-000000000001' $$,
  'admin can set a fragrance image');
select throws_ok(
  $$ update public.fragrances set name = 'Renamed' where id = 'dddddddd-0000-0000-0000-000000000001' $$,
  '42501', null, 'even admins can only change image columns from the app');

reset role;
select is(
  (select image_credit from public.fragrances where id = 'dddddddd-0000-0000-0000-000000000001'),
  'Photo: SCENTLOG', 'the regular user''s image change had no effect; the admin''s did');

select * from finish();
rollback;
