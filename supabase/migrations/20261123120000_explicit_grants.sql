-- =============================================================================
-- SCENTLOG — Explicit table privileges
-- -----------------------------------------------------------------------------
-- New Supabase projects no longer grant table privileges to the `anon` and
-- `authenticated` roles automatically. Every privilege the API needs is
-- therefore granted explicitly here. Row Level Security still decides WHICH
-- rows each user can see or change; these grants only open the door.
--
-- Rule for future migrations: every new table must grant its privileges
-- explicitly, following the same pattern.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Functions used inside CHECK constraints run as the calling user.
grant execute on function public.is_reserved_username(text) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Read access (RLS filters private rows)
-- -----------------------------------------------------------------------------
grant select on
  public.profiles,
  public.brands,
  public.perfumers,
  public.fragrance_families,
  public.notes,
  public.fragrances,
  public.fragrance_perfumers,
  public.fragrance_notes,
  public.user_fragrances,
  public.reviews,
  public.review_likes,
  public.review_comments,
  public.follows,
  public.lists,
  public.list_fragrances,
  public.list_likes,
  public.profile_favorites,
  public.activity_events
to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Write access for signed-in users (RLS limits it to their own rows).
-- Column-restricted INSERT/UPDATE grants for tables with protected counters
-- were already defined in the initial schema migration.
-- -----------------------------------------------------------------------------
grant insert (user_id, fragrance_id, status, rating, notes, is_private, added_on)
  on public.user_fragrances to authenticated;
grant update (status, rating, notes, is_private, added_on)
  on public.user_fragrances to authenticated;
grant delete on public.user_fragrances to authenticated;

grant insert (user_id, fragrance_id, body, longevity, projection, sillage, versatility, value)
  on public.reviews to authenticated;
grant update (body, longevity, projection, sillage, versatility, value)
  on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

grant insert, delete on public.review_likes to authenticated;

grant insert (review_id, user_id, body) on public.review_comments to authenticated;
grant update (body) on public.review_comments to authenticated;
grant delete on public.review_comments to authenticated;

grant insert, delete on public.follows to authenticated;

grant insert (user_id, title, description, cover_image_url, is_public, is_ranked)
  on public.lists to authenticated;
grant update (title, description, cover_image_url, is_public, is_ranked)
  on public.lists to authenticated;
grant delete on public.lists to authenticated;

grant insert (list_id, fragrance_id, position, note) on public.list_fragrances to authenticated;
grant update (position, note) on public.list_fragrances to authenticated;
grant delete on public.list_fragrances to authenticated;

grant insert, delete on public.list_likes to authenticated;

grant insert, update, delete on public.profile_favorites to authenticated;

grant update (username, display_name, bio, avatar_url, locale)
  on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- service_role (secret key, server-side admin tasks only; bypasses RLS)
-- -----------------------------------------------------------------------------
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
