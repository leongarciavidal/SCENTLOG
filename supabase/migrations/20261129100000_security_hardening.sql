-- =============================================================================
-- SCENTLOG — Security hardening for launch
--   1. Per-user rate limits on user-generated content (anti-spam)
--   2. Admin moderation (delete any review, comment or list)
--   3. Self-service account deletion (GDPR "right to erasure")
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Rate limits
-- -----------------------------------------------------------------------------
-- Generic BEFORE INSERT trigger. Arguments: max rows, time window, user column.
-- Applies only to requests made through the API by signed-in users; seed
-- scripts, migrations and the secret key are not limited.
create or replace function public.enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_rows int := tg_argv[0]::int;
  time_window interval := tg_argv[1]::interval;
  user_column text := tg_argv[2];
  uid uuid;
  recent int;
begin
  if coalesce((select auth.jwt()) ->> 'role', '') <> 'authenticated' then
    return new;
  end if;

  execute format('select ($1).%I', user_column) into uid using new;
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - $2',
    tg_table_schema, tg_table_name, user_column
  ) into recent using uid, time_window;

  if recent >= max_rows then
    raise exception 'rate limit exceeded' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_rate_limit() from public, anon, authenticated;

create trigger rate_limit_reviews before insert on public.reviews
  for each row execute function public.enforce_rate_limit('20', '1 hour', 'user_id');
create trigger rate_limit_review_comments before insert on public.review_comments
  for each row execute function public.enforce_rate_limit('30', '10 minutes', 'user_id');
create trigger rate_limit_lists before insert on public.lists
  for each row execute function public.enforce_rate_limit('20', '1 hour', 'user_id');
create trigger rate_limit_follows before insert on public.follows
  for each row execute function public.enforce_rate_limit('100', '1 hour', 'follower_id');
create trigger rate_limit_review_likes before insert on public.review_likes
  for each row execute function public.enforce_rate_limit('300', '1 hour', 'user_id');
create trigger rate_limit_list_likes before insert on public.list_likes
  for each row execute function public.enforce_rate_limit('300', '1 hour', 'user_id');
create trigger rate_limit_user_fragrances before insert on public.user_fragrances
  for each row execute function public.enforce_rate_limit('200', '1 hour', 'user_id');

create index review_comments_user_recent_idx on public.review_comments (user_id, created_at desc);
create index reviews_user_recent_idx on public.reviews (user_id, created_at desc);
create index review_likes_user_recent_idx on public.review_likes (user_id, created_at desc);
create index list_likes_user_recent_idx on public.list_likes (user_id, created_at desc);
create index user_fragrances_user_recent_idx on public.user_fragrances (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Admin moderation
-- -----------------------------------------------------------------------------
create policy "Admins delete any review" on public.reviews
  for delete to authenticated using ((select public.is_admin()));
create policy "Admins delete any comment" on public.review_comments
  for delete to authenticated using ((select public.is_admin()));
create policy "Admins delete any list" on public.lists
  for delete to authenticated using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 3. Account deletion
-- -----------------------------------------------------------------------------
-- Deletes the caller's auth user; every row that belongs to them (profile,
-- diary, reviews, comments, likes, follows, lists, activity) is removed by
-- ON DELETE CASCADE. Uploaded files are removed by the app beforehand.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
