-- =============================================================================
-- SCENTLOG — List item helpers
-- -----------------------------------------------------------------------------
-- Both run as the caller (security invoker): RLS guarantees only the list's
-- owner can add or reorder items.
-- =============================================================================

-- Appends a fragrance to the end of a list. Adding one that is already in the
-- list is a no-op.
create or replace function public.add_list_item(p_list_id uuid, p_fragrance_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.lists l where l.id = p_list_id and l.user_id = (select auth.uid())
  ) then
    raise exception 'list not found' using errcode = '42501';
  end if;

  insert into public.list_fragrances (list_id, fragrance_id, position)
  values (
    p_list_id,
    p_fragrance_id,
    coalesce((select max(lf.position) + 1 from public.list_fragrances lf where lf.list_id = p_list_id), 0)
  )
  on conflict (list_id, fragrance_id) do nothing;
end;
$$;

-- Sets the order of a list: p_fragrance_ids must contain every item exactly once.
create or replace function public.reorder_list_items(p_list_id uuid, p_fragrance_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item_count int;
  given int := coalesce(array_length(p_fragrance_ids, 1), 0);
begin
  if not exists (
    select 1 from public.lists l where l.id = p_list_id and l.user_id = (select auth.uid())
  ) then
    raise exception 'list not found' using errcode = '42501';
  end if;

  select count(*) into item_count from public.list_fragrances where list_id = p_list_id;
  if item_count <> given
     or (select count(distinct x) from unnest(p_fragrance_ids) as x) <> given
     or exists (
       select 1 from unnest(p_fragrance_ids) as x
       where not exists (
         select 1 from public.list_fragrances lf where lf.list_id = p_list_id and lf.fragrance_id = x
       )
     )
  then
    raise exception 'the new order must contain every item exactly once' using errcode = '22023';
  end if;

  -- The (list_id, position) unique constraint is deferred, so positions can
  -- be swapped freely inside this transaction.
  update public.list_fragrances lf
  set position = ordered.ord - 1
  from unnest(p_fragrance_ids) with ordinality as ordered (fragrance_id, ord)
  where lf.list_id = p_list_id and lf.fragrance_id = ordered.fragrance_id;
end;
$$;

revoke execute on function public.add_list_item(uuid, uuid) from public, anon;
revoke execute on function public.reorder_list_items(uuid, uuid[]) from public, anon;
grant execute on function public.add_list_item(uuid, uuid) to authenticated;
grant execute on function public.reorder_list_items(uuid, uuid[]) to authenticated;

create index lists_public_recent_idx on public.lists (created_at desc) where is_public;
