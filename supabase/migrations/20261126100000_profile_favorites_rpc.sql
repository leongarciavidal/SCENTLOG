-- =============================================================================
-- SCENTLOG — Set the "top four" favourites in one atomic call
-- -----------------------------------------------------------------------------
-- Replaces the signed-in user's favourites with the given list (max 4, in
-- order). Runs as the caller (security invoker), so RLS still applies.
-- =============================================================================

create or replace function public.set_profile_favorites(fragrance_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  ids uuid[] := array(select x from unnest(coalesce(fragrance_ids, '{}')) as x where x is not null);
  total int := coalesce(array_length(ids, 1), 0);
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if total > 4 then
    raise exception 'a maximum of four favourites is allowed' using errcode = '22023';
  end if;
  if (select count(distinct x) from unnest(ids) as x) <> total then
    raise exception 'favourites must be different fragrances' using errcode = '22023';
  end if;

  delete from public.profile_favorites where user_id = uid;
  for i in 1 .. total loop
    insert into public.profile_favorites (user_id, fragrance_id, position)
    values (uid, ids[i], i);
  end loop;
end;
$$;

revoke execute on function public.set_profile_favorites(uuid[]) from public, anon;
grant execute on function public.set_profile_favorites(uuid[]) to authenticated;
