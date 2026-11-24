-- =============================================================================
-- Reviews, likes, comments, follows and the activity feed
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-0000-0000-0000-000000000001', 'ana@x.com', '{"username":"ana_s"}'),
  ('b2222222-0000-0000-0000-000000000002', 'bea@x.com', '{"username":"bea_s"}'),
  ('c3333333-0000-0000-0000-000000000003', 'cai@x.com', '{"username":"cai_s"}');
insert into public.brands (id, slug, name) values ('d0000000-0000-0000-0000-000000000001', 'social-house', 'Social House');
insert into public.fragrances (id, slug, brand_id, name, concentration) values
  ('e0000000-0000-0000-0000-000000000001', 'social-one', 'd0000000-0000-0000-0000-000000000001', 'One', 'edp'),
  ('e0000000-0000-0000-0000-000000000002', 'social-two', 'd0000000-0000-0000-0000-000000000001', 'Two', 'edp');

-- Ana ------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1111111-0000-0000-0000-000000000001","role":"authenticated"}';

select throws_ok(
  $$ insert into public.reviews (user_id, fragrance_id, body)
     values ('a1111111-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'No entry yet') $$,
  '23503', null, 'a review needs a diary entry for the same fragrance');

insert into public.user_fragrances (user_id, fragrance_id, status, rating)
values ('a1111111-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'tested', 4);
insert into public.user_fragrances (user_id, fragrance_id, status, is_private)
values ('a1111111-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'wishlist', true);
select lives_ok(
  $$ insert into public.reviews (user_id, fragrance_id, body, longevity, sillage)
     values ('a1111111-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Soft and long.', 5, 3) $$,
  'with a diary entry the review is accepted');
select throws_ok(
  $$ insert into public.reviews (user_id, fragrance_id, body)
     values ('a1111111-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Second one') $$,
  '23505', null, 'only one review per user and fragrance');
select throws_ok(
  $$ update public.reviews set longevity = 6 where user_id = 'a1111111-0000-0000-0000-000000000001' $$,
  '23514', null, 'review dimensions must be between 1 and 5');

-- Bea follows Ana, likes and comments ------------------------------------------
set local request.jwt.claims = '{"sub":"b2222222-0000-0000-0000-000000000002","role":"authenticated"}';
insert into public.follows (follower_id, following_id)
values ('b2222222-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001');
insert into public.review_likes (user_id, review_id)
select 'b2222222-0000-0000-0000-000000000002', id from public.reviews where user_id = 'a1111111-0000-0000-0000-000000000001';
insert into public.review_comments (review_id, user_id, body)
select id, 'b2222222-0000-0000-0000-000000000002', 'Agreed!' from public.reviews where user_id = 'a1111111-0000-0000-0000-000000000001';

select results_eq(
  $$ select type::text from public.feed_events() where actor_id = 'a1111111-0000-0000-0000-000000000001' order by id $$,
  $$ values ('diary_entry'), ('review') $$,
  'Bea''s feed shows Ana''s public diary entry and review, not her private wishlist');
select ok(
  exists (select 1 from public.feed_events() where actor_id = 'b2222222-0000-0000-0000-000000000002' and type = 'follow'),
  'Bea''s feed includes her own follow');
select is(
  (select count(*)::int from public.feed_events(1)), 1, 'page_size limits the number of events');
select is(
  (select count(*)::int from public.feed_events(30, (select min(id) from public.activity_events))), 0,
  'before_id paginates backwards');

-- Cai follows nobody ------------------------------------------------------------
set local request.jwt.claims = '{"sub":"c3333333-0000-0000-0000-000000000003","role":"authenticated"}';
select is(
  (select count(*)::int from public.feed_events()), 0, 'Cai follows nobody and sees an empty feed');
delete from public.review_comments where user_id = 'b2222222-0000-0000-0000-000000000002';

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select * from public.feed_events() $$, '42501', null, 'visitors have no feed');

reset role;
select is(
  (select comment_count from public.reviews where user_id = 'a1111111-0000-0000-0000-000000000001'),
  1, 'Cai could not delete Bea''s comment; comment count is maintained');
select is(
  (select like_count from public.reviews where user_id = 'a1111111-0000-0000-0000-000000000001'),
  1, 'like count is maintained');

select * from finish();
rollback;
