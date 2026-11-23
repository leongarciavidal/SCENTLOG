-- =============================================================================
-- Database tests (pgTAP). Run with:  npm run db:test
-- Everything runs inside a transaction that is rolled back at the end.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(36);

-- ---------------------------------------------------------------------------
-- Setup: two users (Ana and Ben). Inserting into auth.users fires the
-- handle_new_user trigger, which creates their profiles.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@example.com', '{"username":"Ana_Notes","locale":"es"}'),
  ('22222222-2222-2222-2222-222222222222', 'ben@example.com', '{"username":"admin"}'),
  ('33333333-3333-3333-3333-333333333333', 'cy@example.com',  '{"username":"ana_notes"}');

select is(
  (select username from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'ana_notes', 'requested username is lower-cased and kept');
select is(
  (select locale from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'es', 'locale from sign-up metadata is stored');
select matches(
  (select username from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  '^user_[0-9a-f]{10}$', 'reserved username falls back to a generated one');
select matches(
  (select username from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  '^user_[0-9a-f]{10}$', 'taken username falls back to a generated one');

-- A test fragrance (catalogue writes are done as the database owner).
insert into public.brands (id, slug, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'test-house', 'Test House');
insert into public.fragrances (id, slug, brand_id, name, concentration, release_year) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'test-house-one-edp',
   'aaaaaaaa-0000-0000-0000-000000000001', 'One', 'edp', 2020),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'test-house-one-edt',
   'aaaaaaaa-0000-0000-0000-000000000001', 'One', 'edt', 2020);

select throws_ok(
  $$ insert into public.fragrances (slug, brand_id, name, concentration, release_year)
     values ('dup', 'aaaaaaaa-0000-0000-0000-000000000001', 'One', 'edp', 2020) $$,
  '23505', null, 'same brand + name + concentration + year cannot be duplicated');

-- ---------------------------------------------------------------------------
-- Anonymous visitor
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select ok((select count(*) from public.fragrances) >= 2, 'anon can read the catalogue');
select ok((select count(*) from public.profiles) >= 3, 'anon can read public profiles');
select throws_ok(
  $$ insert into public.brands (slug, name) values ('hack', 'Hack') $$,
  '42501', null, 'anon cannot write to the catalogue');
select throws_ok(
  $$ insert into public.lists (user_id, title)
     values ('11111111-1111-1111-1111-111111111111', 'x') $$,
  '42501', null, 'anon cannot create lists');

-- ---------------------------------------------------------------------------
-- Ana (authenticated)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.user_fragrances (user_id, fragrance_id, status, rating)
     values ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000001', 'owned', 4.5) $$,
  'Ana adds a fragrance to her diary');
select throws_ok(
  $$ insert into public.user_fragrances (user_id, fragrance_id, status)
     values ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000001', 'tested') $$,
  '23505', null, 'duplicate diary entry for the same fragrance is rejected');
select throws_ok(
  $$ insert into public.user_fragrances (user_id, fragrance_id, status, rating)
     values ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000002', 'tested', 4.3) $$,
  '23514', null, 'ratings must be in steps of 0.5');
select throws_ok(
  $$ insert into public.user_fragrances (user_id, fragrance_id, status)
     values ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-0000-0000-0000-000000000002', 'tested') $$,
  '42501', null, 'Ana cannot create a diary entry for Ben');
select lives_ok(
  $$ insert into public.user_fragrances (user_id, fragrance_id, status, is_private)
     values ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000002', 'wishlist', true) $$,
  'Ana adds a private wishlist entry');

select lives_ok(
  $$ insert into public.reviews (user_id, fragrance_id, body, longevity)
     values ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000001', 'Lovely.', 4) $$,
  'Ana reviews a fragrance in her diary');
select throws_ok(
  $$ update public.reviews set like_count = 999
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'Ana cannot tamper with her review like_count');
select throws_ok(
  $$ update public.fragrances set rating_avg = 5 $$,
  '42501', null, 'Ana cannot tamper with fragrance ratings');

select lives_ok(
  $$ insert into public.lists (user_id, title, is_public)
     values ('11111111-1111-1111-1111-111111111111', 'Secret', false) $$,
  'Ana creates a private list');
-- Remember the generated id for later assertions.
do $$ begin
  perform set_config('test.list_id',
    (select id::text from public.lists where title = 'Secret'), true);
end $$;
select lives_ok(
  $$ insert into public.list_fragrances (list_id, fragrance_id, position)
     values (current_setting('test.list_id')::uuid, 'bbbbbbbb-0000-0000-0000-000000000001', 0) $$,
  'Ana adds an item to her list');
select lives_ok(
  $$ update public.profiles set bio = 'Iris forever.'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'Ana edits her own profile');
select throws_ok(
  $$ update public.profiles set username = 'Bad Name!'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'invalid usernames are rejected');

-- ---------------------------------------------------------------------------
-- Ben (authenticated, different user)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.user_fragrances
   where user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'Ben sees Ana''s public diary entry but not her private one');
select is(
  (select count(*)::int from public.lists where id = current_setting('test.list_id')::uuid),
  0, 'Ben cannot see Ana''s private list');
select is(
  (select count(*)::int from public.list_fragrances
   where list_id = current_setting('test.list_id')::uuid),
  0, 'Ben cannot see items of Ana''s private list');

update public.profiles set bio = 'hacked' where id = '11111111-1111-1111-1111-111111111111';
update public.reviews set body = 'hacked' where user_id = '11111111-1111-1111-1111-111111111111';
delete from public.user_fragrances where user_id = '11111111-1111-1111-1111-111111111111';

select lives_ok(
  $$ insert into public.review_likes (user_id, review_id)
     select '22222222-2222-2222-2222-222222222222', id from public.reviews
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  'Ben likes Ana''s review');
select lives_ok(
  $$ insert into public.follows (follower_id, following_id)
     values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111') $$,
  'Ben follows Ana');
select throws_ok(
  $$ insert into public.follows (follower_id, following_id)
     values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null, 'Ben cannot make Ana follow him');
select throws_ok(
  $$ insert into public.follows (follower_id, following_id)
     values ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222') $$,
  '23514', null, 'users cannot follow themselves');

-- Activity visible to Ben: Ana's public diary entry + review + Ben's own follow.
-- Ana's private wishlist entry and private list must not appear.
select is(
  (select count(*)::int from public.activity_events
   where actor_id = '11111111-1111-1111-1111-111111111111'),
  2, 'Ben sees only Ana''s public activity');

-- ---------------------------------------------------------------------------
-- Back to the database owner to verify that Ben's writes had no effect
-- and that counters were maintained by triggers.
-- ---------------------------------------------------------------------------
reset role;

select is(
  (select bio from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Iris forever.', 'Ben could not edit Ana''s profile');
select is(
  (select body from public.reviews where user_id = '11111111-1111-1111-1111-111111111111'),
  'Lovely.', 'Ben could not edit Ana''s review');
select is(
  (select count(*)::int from public.user_fragrances
   where user_id = '11111111-1111-1111-1111-111111111111'),
  2, 'Ben could not delete Ana''s diary entries');

select is(
  (select rating_avg from public.fragrances where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  4.50::numeric, 'fragrance rating average is maintained');
select is(
  (select review_count from public.fragrances where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  1, 'fragrance review count is maintained');
select is(
  (select like_count from public.reviews where user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'review like count is maintained');
select is(
  (select item_count from public.lists where id = current_setting('test.list_id')::uuid),
  1, 'list item count is maintained');

select * from finish();
rollback;
