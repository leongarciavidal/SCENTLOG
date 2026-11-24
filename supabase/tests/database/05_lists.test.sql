-- =============================================================================
-- Lists: adding, ordering, privacy and likes
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-1111-0000-0000-000000000001', 'owner@x.com', '{"username":"list_owner"}'),
  ('b0000000-2222-0000-0000-000000000002', 'other@x.com', '{"username":"list_other"}');
insert into public.brands (id, slug, name) values ('c0000000-3333-0000-0000-000000000001', 'list-house', 'List House');
insert into public.fragrances (id, slug, brand_id, name, concentration) values
  ('f1000000-0000-0000-0000-000000000001', 'list-a', 'c0000000-3333-0000-0000-000000000001', 'A', 'edp'),
  ('f1000000-0000-0000-0000-000000000002', 'list-b', 'c0000000-3333-0000-0000-000000000001', 'B', 'edp'),
  ('f1000000-0000-0000-0000-000000000003', 'list-c', 'c0000000-3333-0000-0000-000000000001', 'C', 'edp');

set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-1111-0000-0000-000000000001","role":"authenticated"}';
insert into public.lists (user_id, title, is_public, is_ranked)
values ('a0000000-1111-0000-0000-000000000001', 'Winter evenings', true, true),
       ('a0000000-1111-0000-0000-000000000001', 'Secret stash', false, false);
do $$ begin
  perform set_config('test.public_list', (select id::text from public.lists where title = 'Winter evenings'), true);
  perform set_config('test.private_list', (select id::text from public.lists where title = 'Secret stash'), true);
end $$;

select public.add_list_item(current_setting('test.public_list')::uuid, 'f1000000-0000-0000-0000-000000000001');
select public.add_list_item(current_setting('test.public_list')::uuid, 'f1000000-0000-0000-0000-000000000002');
select public.add_list_item(current_setting('test.public_list')::uuid, 'f1000000-0000-0000-0000-000000000003');
select lives_ok(
  $$ select public.add_list_item(current_setting('test.public_list')::uuid, 'f1000000-0000-0000-0000-000000000001') $$,
  'adding a fragrance twice is a harmless no-op');
select results_eq(
  $$ select fragrance_id from public.list_fragrances where list_id = current_setting('test.public_list')::uuid order by position $$,
  $$ values ('f1000000-0000-0000-0000-000000000001'::uuid), ('f1000000-0000-0000-0000-000000000002'::uuid), ('f1000000-0000-0000-0000-000000000003'::uuid) $$,
  'items are appended in order');

select lives_ok(
  $$ select public.reorder_list_items(current_setting('test.public_list')::uuid, array[
       'f1000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000002']::uuid[]) $$,
  'owner reorders the list');
select results_eq(
  $$ select fragrance_id from public.list_fragrances where list_id = current_setting('test.public_list')::uuid order by position $$,
  $$ values ('f1000000-0000-0000-0000-000000000003'::uuid), ('f1000000-0000-0000-0000-000000000001'::uuid), ('f1000000-0000-0000-0000-000000000002'::uuid) $$,
  'the new order is stored');
select throws_ok(
  $$ select public.reorder_list_items(current_setting('test.public_list')::uuid, array['f1000000-0000-0000-0000-000000000003']::uuid[]) $$,
  '22023', null, 'a reorder must include every item');
select is(
  (select item_count from public.lists where id = current_setting('test.public_list')::uuid), 3,
  'item count is maintained');

select public.add_list_item(current_setting('test.private_list')::uuid, 'f1000000-0000-0000-0000-000000000001');

-- Another user ------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"b0000000-2222-0000-0000-000000000002","role":"authenticated"}';
select throws_ok(
  $$ select public.add_list_item(current_setting('test.public_list')::uuid, 'f1000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'others cannot add items to your list');
select throws_ok(
  $$ select public.reorder_list_items(current_setting('test.public_list')::uuid, array[
       'f1000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000003']::uuid[]) $$,
  '42501', null, 'others cannot reorder your list');
select lives_ok(
  $$ insert into public.list_likes (user_id, list_id)
     values ('b0000000-2222-0000-0000-000000000002', current_setting('test.public_list')::uuid) $$,
  'others can like a public list');
select throws_ok(
  $$ insert into public.list_likes (user_id, list_id)
     values ('b0000000-2222-0000-0000-000000000002', current_setting('test.private_list')::uuid) $$,
  '42501', null, 'nobody else can like (or even see) a private list');

reset role;
select is(
  (select like_count from public.lists where id = current_setting('test.public_list')::uuid), 1,
  'list like count is maintained');

select * from finish();
rollback;
