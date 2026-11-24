-- =============================================================================
-- Diary behaviour and the set_profile_favorites RPC
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-aaaa-aaaa-aaaa-111111111111', 'una@example.com', '{"username":"una"}'),
  ('22222222-bbbb-bbbb-bbbb-222222222222', 'dos@example.com', '{"username":"dos"}');

insert into public.brands (id, slug, name) values ('99999999-0000-0000-0000-000000000001', 'house', 'House');
insert into public.fragrances (id, slug, brand_id, name, concentration) values
  ('f0000000-0000-0000-0000-000000000001', 'house-a', '99999999-0000-0000-0000-000000000001', 'A', 'edp'),
  ('f0000000-0000-0000-0000-000000000002', 'house-b', '99999999-0000-0000-0000-000000000001', 'B', 'edp'),
  ('f0000000-0000-0000-0000-000000000003', 'house-c', '99999999-0000-0000-0000-000000000001', 'C', 'edp'),
  ('f0000000-0000-0000-0000-000000000004', 'house-d', '99999999-0000-0000-0000-000000000001', 'D', 'edp'),
  ('f0000000-0000-0000-0000-000000000005', 'house-e', '99999999-0000-0000-0000-000000000001', 'E', 'edp');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-aaaa-aaaa-aaaa-111111111111","role":"authenticated"}';

-- Diary: two users rate the same fragrance → community average.
insert into public.user_fragrances (user_id, fragrance_id, status, rating)
values ('11111111-aaaa-aaaa-aaaa-111111111111', 'f0000000-0000-0000-0000-000000000001', 'owned', 4.5);

select lives_ok(
  $$ update public.user_fragrances set status = 'finished', rating = 3.5
     where user_id = '11111111-aaaa-aaaa-aaaa-111111111111' $$,
  'user can change status and rating of an entry');

select lives_ok(
  $$ select public.set_profile_favorites(array[
       'f0000000-0000-0000-0000-000000000003',
       'f0000000-0000-0000-0000-000000000001']::uuid[]) $$,
  'user sets two favourites');
select results_eq(
  $$ select fragrance_id from public.profile_favorites
     where user_id = '11111111-aaaa-aaaa-aaaa-111111111111' order by position $$,
  $$ values ('f0000000-0000-0000-0000-000000000003'::uuid), ('f0000000-0000-0000-0000-000000000001'::uuid) $$,
  'favourites are stored in the given order');

select lives_ok(
  $$ select public.set_profile_favorites(array['f0000000-0000-0000-0000-000000000002']::uuid[]) $$,
  'favourites can be replaced');
select is(
  (select count(*)::int from public.profile_favorites where user_id = '11111111-aaaa-aaaa-aaaa-111111111111'),
  1, 'replacing removes the previous favourites');

select throws_ok(
  $$ select public.set_profile_favorites(array[
       'f0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000002',
       'f0000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000004',
       'f0000000-0000-0000-0000-000000000005']::uuid[]) $$,
  '22023', null, 'more than four favourites is rejected');
select throws_ok(
  $$ select public.set_profile_favorites(array[
       'f0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001']::uuid[]) $$,
  '22023', null, 'duplicate favourites are rejected');
select lives_ok(
  $$ select public.set_profile_favorites('{}'::uuid[]) $$,
  'favourites can be cleared');

-- Second user
set local request.jwt.claims = '{"sub":"22222222-bbbb-bbbb-bbbb-222222222222","role":"authenticated"}';
insert into public.user_fragrances (user_id, fragrance_id, status, rating)
values ('22222222-bbbb-bbbb-bbbb-222222222222', 'f0000000-0000-0000-0000-000000000001', 'tested', 5);
select is(
  (select count(*)::int from public.profile_favorites where user_id = '11111111-aaaa-aaaa-aaaa-111111111111'),
  0, 'other users cannot see a cleared list as anything but empty');

-- Anonymous visitors cannot call the RPC at all.
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select public.set_profile_favorites(array['f0000000-0000-0000-0000-000000000001']::uuid[]) $$,
  '42501', null, 'anonymous visitors cannot set favourites');

reset role;
select is(
  (select rating_avg from public.fragrances where id = 'f0000000-0000-0000-0000-000000000001'),
  4.25::numeric, 'community average reflects both diary ratings (3.5 and 5)');

select * from finish();
rollback;
