-- =============================================================================
-- SCENTLOG — Activity feed
-- -----------------------------------------------------------------------------
-- Events from the people the signed-in user follows, plus their own, newest
-- first, with keyset pagination (pass the last id seen as before_id).
-- Runs as the caller, so the activity RLS policy still hides events about
-- private diary entries and private lists. Returning `setof activity_events`
-- lets PostgREST embed related rows (actor, fragrance, review…).
-- =============================================================================

create or replace function public.feed_events(page_size int default 30, before_id bigint default null)
returns setof public.activity_events
language sql
stable
security invoker
set search_path = ''
as $$
  select e.*
  from public.activity_events e
  where (
      e.actor_id = (select auth.uid())
      or e.actor_id in (select f.following_id from public.follows f where f.follower_id = (select auth.uid()))
    )
    and (before_id is null or e.id < before_id)
  order by e.id desc
  limit least(greatest(coalesce(page_size, 30), 1), 100);
$$;

revoke execute on function public.feed_events(int, bigint) from public, anon;
grant execute on function public.feed_events(int, bigint) to authenticated;

create index follows_follower_idx on public.follows (follower_id, created_at desc);
