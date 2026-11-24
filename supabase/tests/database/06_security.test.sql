-- =============================================================================
-- Rate limits, admin moderation and account deletion
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email, raw_user_meta_data) values
  ('a7000000-0000-0000-0000-000000000001', 'writer@x.com', '{"username":"sec_writer"}'),
  ('b7000000-0000-0000-0000-000000000002', 'mod@x.com', '{"username":"sec_mod"}'),
  ('c7000000-0000-0000-0000-000000000003', 'leaver@x.com', '{"username":"sec_leaver"}');
update public.profiles set is_admin = true where id = 'b7000000-0000-0000-0000-000000000002';
insert into public.brands (id, slug, name) values ('d7000000-0000-0000-0000-000000000001', 'sec-house', 'Sec House');
insert into public.fragrances (id, slug, brand_id, name, concentration) values
  ('e7000000-0000-0000-0000-000000000001', 'sec-one', 'd7000000-0000-0000-0000-000000000001', 'One', 'edp');

-- Seed data as the database owner is never rate limited.
insert into public.user_fragrances (user_id, fragrance_id, status)
values ('a7000000-0000-0000-0000-000000000001', 'e7000000-0000-0000-0000-000000000001', 'tested');
insert into public.reviews (user_id, fragrance_id, body)
values ('a7000000-0000-0000-0000-000000000001', 'e7000000-0000-0000-0000-000000000001', 'Spam magnet');

-- Writer -------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"a7000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$ insert into public.review_comments (review_id, user_id, body)
     select r.id, 'a7000000-0000-0000-0000-000000000001', 'comment ' || g
     from public.reviews r, generate_series(1, 30) g $$,
  '30 comments in a few minutes are accepted');
select throws_like(
  $$ insert into public.review_comments (review_id, user_id, body)
     select id, 'a7000000-0000-0000-0000-000000000001', 'one too many' from public.reviews $$,
  '%rate limit exceeded%', 'the 31st comment within 10 minutes is rejected');
select lives_ok(
  $$ insert into public.lists (user_id, title) values ('a7000000-0000-0000-0000-000000000001', 'Fine') $$,
  'limits are per table: creating a list still works');

-- Moderator -----------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"b7000000-0000-0000-0000-000000000002","role":"authenticated"}';
delete from public.review_comments where body = 'comment 1';
select is((select count(*)::int from public.review_comments where body = 'comment 1'), 0, 'admins can delete any comment');
delete from public.reviews where user_id = 'a7000000-0000-0000-0000-000000000001';
select is((select count(*)::int from public.reviews where user_id = 'a7000000-0000-0000-0000-000000000001'), 0, 'admins can delete any review');

-- A regular user cannot moderate ----------------------------------------------------
set local request.jwt.claims = '{"sub":"c7000000-0000-0000-0000-000000000003","role":"authenticated"}';
delete from public.lists where user_id = 'a7000000-0000-0000-0000-000000000001';
select is((select count(*)::int from public.lists where user_id = 'a7000000-0000-0000-0000-000000000001'), 1, 'regular users cannot delete others'' lists');

-- Account deletion ---------------------------------------------------------------------
insert into public.follows (follower_id, following_id) values ('c7000000-0000-0000-0000-000000000003', 'a7000000-0000-0000-0000-000000000001');
select lives_ok($$ select public.delete_my_account() $$, 'a user can delete their own account');

reset role;
select is((select count(*)::int from public.profiles where id = 'c7000000-0000-0000-0000-000000000003'), 0, 'their profile is gone');
select is((select count(*)::int from public.follows where follower_id = 'c7000000-0000-0000-0000-000000000003'), 0, 'their data is removed in cascade');

select * from finish();
rollback;
