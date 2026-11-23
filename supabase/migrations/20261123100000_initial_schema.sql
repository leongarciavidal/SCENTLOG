-- =============================================================================
-- SCENTLOG — Initial schema
-- -----------------------------------------------------------------------------
-- Creates every core table, constraint, index, trigger and Row Level Security
-- policy. Catalogue tables (brands, fragrances, notes…) are read-only for app
-- users; they are managed through migrations / seed scripts / the secret key.
--
-- Conventions
--   * All tables live in `public` and have RLS enabled.
--   * Functions use `set search_path = ''` and fully-qualified names.
--   * `(select auth.uid())` is used in policies so Postgres evaluates it once
--     per statement instead of once per row (Supabase performance guidance).
--   * Counter columns (rating_avg, like_count…) are maintained by triggers and
--     cannot be written by app users (column-level privileges below).
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
create type public.fragrance_concentration as enum (
  'edc', 'edt', 'edp', 'parfum', 'extrait', 'other'
);

create type public.note_layer as enum ('top', 'heart', 'base');

create type public.diary_status as enum ('owned', 'tested', 'wishlist', 'finished');

create type public.activity_type as enum (
  'diary_entry', 'review', 'list', 'follow'
);

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Usernames that would collide with app routes or look official.
create or replace function public.is_reserved_username(name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(name) = any (array[
    'admin', 'administrator', 'api', 'auth', 'about', 'account', 'brands',
    'brand', 'discover', 'explore', 'feed', 'fragrances', 'fragrance', 'help',
    'home', 'lists', 'list', 'login', 'logout', 'me', 'members', 'new',
    'notes', 'perfumers', 'perfumer', 'privacy', 'profile', 'reviews',
    'review', 'scentlog', 'search', 'settings', 'signin', 'signup', 'support',
    'terms', 'user', 'users', 'en', 'es', 'diary', 'activity', 'popular'
  ]);
$$;

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text not null unique,
  display_name  text,
  bio           text,
  avatar_url    text,
  locale        text not null default 'en',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint profiles_username_format
    check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint profiles_username_not_reserved
    check (not public.is_reserved_username(username)),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) between 1 and 60),
  constraint profiles_bio_length
    check (bio is null or char_length(bio) <= 500),
  constraint profiles_locale_supported
    check (locale in ('en', 'es'))
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the profile row automatically when someone signs up.
-- The desired username is passed as user metadata at sign-up time; if it is
-- missing, invalid or taken, a safe fallback is generated (the user can change
-- it later from settings).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  final_username text;
begin
  if requested ~ '^[a-z0-9_]{3,30}$'
     and not public.is_reserved_username(requested)
     and not exists (select 1 from public.profiles where username = requested)
  then
    final_username := requested;
  else
    final_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;

  insert into public.profiles (id, username, display_name, locale)
  values (
    new.id,
    final_username,
    nullif(left(new.raw_user_meta_data ->> 'display_name', 60), ''),
    case when new.raw_user_meta_data ->> 'locale' = 'es' then 'es' else 'en' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Catalogue: brands, perfumers, families, notes, fragrances
-- -----------------------------------------------------------------------------
create table public.brands (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  country       text,
  founded_year  smallint,
  website_url   text,
  logo_url      text,
  description_en text,
  description_es text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint brands_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint brands_founded_year_range
    check (founded_year is null or founded_year between 1500 and 2100)
);

create index brands_name_trgm_idx on public.brands
  using gin (name extensions.gin_trgm_ops);

create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

create table public.perfumers (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  created_at  timestamptz not null default now(),

  constraint perfumers_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.fragrance_families (
  id       smallint generated always as identity primary key,
  slug     text not null unique,
  name_en  text not null,
  name_es  text not null
);

create table public.notes (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  name_en  text not null,
  name_es  text not null,

  constraint notes_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index notes_name_en_trgm_idx on public.notes
  using gin (name_en extensions.gin_trgm_ops);

create table public.fragrances (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  brand_id        uuid not null references public.brands (id) on delete restrict,
  name            text not null,
  concentration   public.fragrance_concentration not null,
  release_year    smallint,
  family_id       smallint references public.fragrance_families (id) on delete set null,
  -- Flankers / other concentrations can point at the original fragrance.
  parent_id       uuid references public.fragrances (id) on delete set null,
  image_url       text,
  image_credit    text,
  description_en  text,
  description_es  text,
  -- Denormalised counters, maintained by triggers.
  rating_avg      numeric(3, 2),
  rating_count    integer not null default 0,
  review_count    integer not null default 0,
  diary_count     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint fragrances_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint fragrances_name_length check (char_length(name) between 1 and 200),
  constraint fragrances_release_year_range
    check (release_year is null or release_year between 1700 and 2100),
  constraint fragrances_not_own_parent check (parent_id is null or parent_id <> id),
  constraint fragrances_unique_edition
    unique nulls not distinct (brand_id, name, concentration, release_year)
);

create index fragrances_brand_idx on public.fragrances (brand_id);
create index fragrances_family_idx on public.fragrances (family_id);
create index fragrances_parent_idx on public.fragrances (parent_id);
create index fragrances_rating_idx on public.fragrances (rating_avg desc nulls last);
create index fragrances_popularity_idx on public.fragrances (diary_count desc);
create index fragrances_name_trgm_idx on public.fragrances
  using gin (name extensions.gin_trgm_ops);

create trigger fragrances_set_updated_at
  before update on public.fragrances
  for each row execute function public.set_updated_at();

create table public.fragrance_perfumers (
  fragrance_id  uuid not null references public.fragrances (id) on delete cascade,
  perfumer_id   uuid not null references public.perfumers (id) on delete cascade,
  primary key (fragrance_id, perfumer_id)
);

create index fragrance_perfumers_perfumer_idx on public.fragrance_perfumers (perfumer_id);

create table public.fragrance_notes (
  fragrance_id  uuid not null references public.fragrances (id) on delete cascade,
  note_id       uuid not null references public.notes (id) on delete cascade,
  layer         public.note_layer not null,
  position      smallint not null default 0,
  primary key (fragrance_id, note_id, layer)
);

create index fragrance_notes_note_idx on public.fragrance_notes (note_id);

-- -----------------------------------------------------------------------------
-- Personal diary
-- -----------------------------------------------------------------------------
create table public.user_fragrances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  fragrance_id  uuid not null references public.fragrances (id) on delete cascade,
  status        public.diary_status not null,
  rating        numeric(2, 1),
  notes         text,
  is_private    boolean not null default false,
  added_on      date not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- One diary entry per user and fragrance.
  constraint user_fragrances_unique unique (user_id, fragrance_id),
  -- 0 to 5 in steps of 0.5.
  constraint user_fragrances_rating_range
    check (rating is null or (rating between 0 and 5 and rating * 2 = trunc(rating * 2))),
  constraint user_fragrances_notes_length
    check (notes is null or char_length(notes) <= 2000)
);

create index user_fragrances_fragrance_idx on public.user_fragrances (fragrance_id);
create index user_fragrances_user_status_idx
  on public.user_fragrances (user_id, status, added_on desc);

create trigger user_fragrances_set_updated_at
  before update on public.user_fragrances
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Reviews, likes, comments
-- -----------------------------------------------------------------------------
-- The overall star rating lives in user_fragrances (single source of truth).
-- A review therefore requires a diary entry for the same fragrance; deleting
-- the entry deletes the review.
create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  fragrance_id   uuid not null references public.fragrances (id) on delete cascade,
  body           text not null,
  longevity      smallint,
  projection     smallint,
  sillage        smallint,
  versatility    smallint,
  value          smallint,
  like_count     integer not null default 0,
  comment_count  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint reviews_unique unique (user_id, fragrance_id),
  constraint reviews_diary_entry_fk foreign key (user_id, fragrance_id)
    references public.user_fragrances (user_id, fragrance_id) on delete cascade,
  constraint reviews_body_length check (char_length(body) between 1 and 10000),
  constraint reviews_dimensions_range check (
        (longevity   is null or longevity   between 1 and 5)
    and (projection  is null or projection  between 1 and 5)
    and (sillage     is null or sillage     between 1 and 5)
    and (versatility is null or versatility between 1 and 5)
    and (value       is null or value       between 1 and 5)
  )
);

create index reviews_fragrance_recent_idx on public.reviews (fragrance_id, created_at desc);
create index reviews_recent_idx on public.reviews (created_at desc);
create index reviews_popular_idx on public.reviews (like_count desc, created_at desc);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.review_likes (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  review_id   uuid not null references public.reviews (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, review_id)
);

create index review_likes_review_idx on public.review_likes (review_id);

create table public.review_comments (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint review_comments_body_length check (char_length(body) between 1 and 2000)
);

create index review_comments_review_idx on public.review_comments (review_id, created_at);
create index review_comments_user_idx on public.review_comments (user_id);

create trigger review_comments_set_updated_at
  before update on public.review_comments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Social graph
-- -----------------------------------------------------------------------------
create table public.follows (
  follower_id   uuid not null references public.profiles (id) on delete cascade,
  following_id  uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index follows_following_idx on public.follows (following_id);

-- -----------------------------------------------------------------------------
-- Lists
-- -----------------------------------------------------------------------------
create table public.lists (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  title            text not null,
  description      text,
  cover_image_url  text,
  is_public        boolean not null default true,
  is_ranked        boolean not null default false,
  item_count       integer not null default 0,
  like_count       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint lists_title_length check (char_length(title) between 1 and 120),
  constraint lists_description_length
    check (description is null or char_length(description) <= 2000)
);

create index lists_user_idx on public.lists (user_id, created_at desc);
create index lists_popular_idx on public.lists (like_count desc) where is_public;

create trigger lists_set_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

create table public.list_fragrances (
  list_id       uuid not null references public.lists (id) on delete cascade,
  fragrance_id  uuid not null references public.fragrances (id) on delete cascade,
  position      integer not null,
  note          text,
  added_at      timestamptz not null default now(),
  primary key (list_id, fragrance_id),
  -- Deferrable so a whole list can be reordered inside one transaction.
  constraint list_fragrances_position_unique unique (list_id, position)
    deferrable initially deferred,
  constraint list_fragrances_position_positive check (position >= 0),
  constraint list_fragrances_note_length check (note is null or char_length(note) <= 500)
);

create index list_fragrances_fragrance_idx on public.list_fragrances (fragrance_id);

create table public.list_likes (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  list_id     uuid not null references public.lists (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, list_id)
);

create index list_likes_list_idx on public.list_likes (list_id);

-- -----------------------------------------------------------------------------
-- Top 4 favourites on a profile
-- -----------------------------------------------------------------------------
create table public.profile_favorites (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  fragrance_id  uuid not null references public.fragrances (id) on delete cascade,
  position      smallint not null,
  primary key (user_id, position),
  constraint profile_favorites_unique unique (user_id, fragrance_id)
    deferrable initially deferred,
  constraint profile_favorites_position_range check (position between 1 and 4)
);

-- -----------------------------------------------------------------------------
-- Activity feed (written only by triggers)
-- -----------------------------------------------------------------------------
create table public.activity_events (
  id                 bigint generated always as identity primary key,
  actor_id           uuid not null references public.profiles (id) on delete cascade,
  type               public.activity_type not null,
  fragrance_id       uuid references public.fragrances (id) on delete cascade,
  user_fragrance_id  uuid references public.user_fragrances (id) on delete cascade,
  review_id          uuid references public.reviews (id) on delete cascade,
  list_id            uuid references public.lists (id) on delete cascade,
  target_user_id     uuid references public.profiles (id) on delete cascade,
  created_at         timestamptz not null default now()
);

create index activity_events_actor_idx on public.activity_events (actor_id, created_at desc);
create index activity_events_recent_idx on public.activity_events (created_at desc);
create index activity_events_user_fragrance_idx on public.activity_events (user_fragrance_id);
create index activity_events_review_idx on public.activity_events (review_id);
create index activity_events_list_idx on public.activity_events (list_id);

-- =============================================================================
-- Counter + activity triggers
-- =============================================================================

-- Fragrance rating / diary counters --------------------------------------------
create or replace function public.refresh_fragrance_diary_stats(target uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.fragrances f
  set rating_avg   = s.avg_rating,
      rating_count = s.rating_count,
      diary_count  = s.diary_count
  from (
    select
      round(avg(uf.rating), 2)               as avg_rating,
      count(uf.rating)::integer              as rating_count,
      count(*)::integer                      as diary_count
    from public.user_fragrances uf
    where uf.fragrance_id = target
  ) s
  where f.id = target;
$$;

create or replace function public.on_user_fragrance_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_fragrance_diary_stats(new.fragrance_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.fragrance_id <> new.fragrance_id) then
    perform public.refresh_fragrance_diary_stats(old.fragrance_id);
  end if;

  -- Activity: log new public entries; drop events when an entry turns private.
  if tg_op = 'INSERT' and not new.is_private then
    insert into public.activity_events (actor_id, type, fragrance_id, user_fragrance_id)
    values (new.user_id, 'diary_entry', new.fragrance_id, new.id);
  elsif tg_op = 'UPDATE' and new.is_private and not old.is_private then
    delete from public.activity_events where user_fragrance_id = new.id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger user_fragrances_after_change
  after insert or update or delete on public.user_fragrances
  for each row execute function public.on_user_fragrance_change();

-- Review counters + activity ---------------------------------------------------
create or replace function public.on_review_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.fragrance_id, old.fragrance_id);
begin
  update public.fragrances
  set review_count = (select count(*) from public.reviews where fragrance_id = target)
  where id = target;

  if tg_op = 'INSERT' then
    insert into public.activity_events (actor_id, type, fragrance_id, review_id)
    values (new.user_id, 'review', new.fragrance_id, new.id);
  end if;

  return coalesce(new, old);
end;
$$;

create trigger reviews_after_change
  after insert or delete on public.reviews
  for each row execute function public.on_review_change();

create or replace function public.on_review_like_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.review_id, old.review_id);
begin
  update public.reviews
  set like_count = (select count(*) from public.review_likes where review_id = target)
  where id = target;
  return coalesce(new, old);
end;
$$;

create trigger review_likes_after_change
  after insert or delete on public.review_likes
  for each row execute function public.on_review_like_change();

create or replace function public.on_review_comment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.review_id, old.review_id);
begin
  update public.reviews
  set comment_count = (select count(*) from public.review_comments where review_id = target)
  where id = target;
  return coalesce(new, old);
end;
$$;

create trigger review_comments_after_change
  after insert or delete on public.review_comments
  for each row execute function public.on_review_comment_change();

-- Follow activity ----------------------------------------------------------------
create or replace function public.on_follow_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_events (actor_id, type, target_user_id)
  values (new.follower_id, 'follow', new.following_id);
  return new;
end;
$$;

create trigger follows_after_insert
  after insert on public.follows
  for each row execute function public.on_follow_insert();

create or replace function public.on_follow_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activity_events
  where type = 'follow' and actor_id = old.follower_id and target_user_id = old.following_id;
  return old;
end;
$$;

create trigger follows_after_delete
  after delete on public.follows
  for each row execute function public.on_follow_delete();

-- List counters + activity -------------------------------------------------------
create or replace function public.on_list_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.is_public then
    insert into public.activity_events (actor_id, type, list_id)
    values (new.user_id, 'list', new.id);
  elsif tg_op = 'UPDATE' and old.is_public and not new.is_public then
    delete from public.activity_events where list_id = new.id;
  end if;
  return new;
end;
$$;

create trigger lists_after_change
  after insert or update of is_public on public.lists
  for each row execute function public.on_list_change();

create or replace function public.on_list_fragrance_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.list_id, old.list_id);
begin
  update public.lists
  set item_count = (select count(*) from public.list_fragrances where list_id = target)
  where id = target;
  return coalesce(new, old);
end;
$$;

create trigger list_fragrances_after_change
  after insert or delete on public.list_fragrances
  for each row execute function public.on_list_fragrance_change();

create or replace function public.on_list_like_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.list_id, old.list_id);
begin
  update public.lists
  set like_count = (select count(*) from public.list_likes where list_id = target)
  where id = target;
  return coalesce(new, old);
end;
$$;

create trigger list_likes_after_change
  after insert or delete on public.list_likes
  for each row execute function public.on_list_like_change();

-- Trigger helper functions must never be callable directly through the API.
revoke execute on function
  public.handle_new_user(),
  public.refresh_fragrance_diary_stats(uuid),
  public.on_user_fragrance_change(),
  public.on_review_change(),
  public.on_review_like_change(),
  public.on_review_comment_change(),
  public.on_follow_insert(),
  public.on_follow_delete(),
  public.on_list_change(),
  public.on_list_fragrance_change(),
  public.on_list_like_change()
from public, anon, authenticated;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles            enable row level security;
alter table public.brands              enable row level security;
alter table public.perfumers           enable row level security;
alter table public.fragrance_families  enable row level security;
alter table public.notes               enable row level security;
alter table public.fragrances          enable row level security;
alter table public.fragrance_perfumers enable row level security;
alter table public.fragrance_notes     enable row level security;
alter table public.user_fragrances     enable row level security;
alter table public.reviews             enable row level security;
alter table public.review_likes        enable row level security;
alter table public.review_comments     enable row level security;
alter table public.follows             enable row level security;
alter table public.lists               enable row level security;
alter table public.list_fragrances     enable row level security;
alter table public.list_likes          enable row level security;
alter table public.profile_favorites   enable row level security;
alter table public.activity_events     enable row level security;

-- Catalogue: anyone can read, nobody can write through the API ------------------
create policy "Catalogue is public" on public.brands
  for select to anon, authenticated using (true);
create policy "Catalogue is public" on public.perfumers
  for select to anon, authenticated using (true);
create policy "Catalogue is public" on public.fragrance_families
  for select to anon, authenticated using (true);
create policy "Catalogue is public" on public.notes
  for select to anon, authenticated using (true);
create policy "Catalogue is public" on public.fragrances
  for select to anon, authenticated using (true);
create policy "Catalogue is public" on public.fragrance_perfumers
  for select to anon, authenticated using (true);
create policy "Catalogue is public" on public.fragrance_notes
  for select to anon, authenticated using (true);

-- Profiles ------------------------------------------------------------------------
create policy "Profiles are public" on public.profiles
  for select to anon, authenticated using (true);
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Diary -------------------------------------------------------------------------
create policy "Public diary entries are visible; private ones only to owner"
  on public.user_fragrances for select to anon, authenticated
  using (not is_private or user_id = (select auth.uid()));
create policy "Users add their own diary entries" on public.user_fragrances
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update their own diary entries" on public.user_fragrances
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users delete their own diary entries" on public.user_fragrances
  for delete to authenticated using (user_id = (select auth.uid()));

-- Reviews ---------------------------------------------------------------------------
create policy "Reviews are public" on public.reviews
  for select to anon, authenticated using (true);
create policy "Users write their own reviews" on public.reviews
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users edit their own reviews" on public.reviews
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users delete their own reviews" on public.reviews
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Review likes are public" on public.review_likes
  for select to anon, authenticated using (true);
create policy "Users like as themselves" on public.review_likes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users remove their own likes" on public.review_likes
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Comments are public" on public.review_comments
  for select to anon, authenticated using (true);
create policy "Users comment as themselves" on public.review_comments
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users edit their own comments" on public.review_comments
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users delete their own comments" on public.review_comments
  for delete to authenticated using (user_id = (select auth.uid()));

-- Follows ------------------------------------------------------------------------
create policy "Follows are public" on public.follows
  for select to anon, authenticated using (true);
create policy "Users follow as themselves" on public.follows
  for insert to authenticated with check (follower_id = (select auth.uid()));
create policy "Users unfollow as themselves" on public.follows
  for delete to authenticated using (follower_id = (select auth.uid()));

-- Lists ----------------------------------------------------------------------------
create policy "Public lists are visible; private ones only to owner" on public.lists
  for select to anon, authenticated
  using (is_public or user_id = (select auth.uid()));
create policy "Users create their own lists" on public.lists
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users edit their own lists" on public.lists
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users delete their own lists" on public.lists
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "List items follow list visibility" on public.list_fragrances
  for select to anon, authenticated
  using (exists (
    select 1 from public.lists l
    where l.id = list_id and (l.is_public or l.user_id = (select auth.uid()))
  ));
create policy "Owners add list items" on public.list_fragrances
  for insert to authenticated
  with check (exists (
    select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())
  ));
create policy "Owners edit list items" on public.list_fragrances
  for update to authenticated
  using (exists (
    select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())
  ));
create policy "Owners remove list items" on public.list_fragrances
  for delete to authenticated
  using (exists (
    select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())
  ));

create policy "List likes follow list visibility" on public.list_likes
  for select to anon, authenticated
  using (exists (
    select 1 from public.lists l
    where l.id = list_id and (l.is_public or l.user_id = (select auth.uid()))
  ));
create policy "Users like public lists as themselves" on public.list_likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.lists l where l.id = list_id and l.is_public)
  );
create policy "Users remove their own list likes" on public.list_likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Favourites -----------------------------------------------------------------------
create policy "Favourites are public" on public.profile_favorites
  for select to anon, authenticated using (true);
create policy "Users set their own favourites" on public.profile_favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users change their own favourites" on public.profile_favorites
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users remove their own favourites" on public.profile_favorites
  for delete to authenticated using (user_id = (select auth.uid()));

-- Activity (read-only; rows come from triggers) ----------------------------------------
create policy "Activity is public when its subject is public" on public.activity_events
  for select to anon, authenticated
  using (
    (user_fragrance_id is null or exists (
      select 1 from public.user_fragrances uf
      where uf.id = user_fragrance_id
        and (not uf.is_private or uf.user_id = (select auth.uid()))
    ))
    and (list_id is null or exists (
      select 1 from public.lists l
      where l.id = list_id and (l.is_public or l.user_id = (select auth.uid()))
    ))
  );

-- =============================================================================
-- Column-level privileges
-- -----------------------------------------------------------------------------
-- RLS decides WHICH rows a user may touch; these grants decide WHICH columns.
-- They stop users from, for example, inflating their own like_count.
-- =============================================================================
revoke insert, update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_url, locale)
  on public.profiles to authenticated;

revoke insert, update, delete on
  public.brands, public.perfumers, public.fragrance_families, public.notes,
  public.fragrances, public.fragrance_perfumers, public.fragrance_notes,
  public.activity_events
from anon, authenticated;

revoke insert, update on public.user_fragrances from anon, authenticated;
grant insert (user_id, fragrance_id, status, rating, notes, is_private, added_on)
  on public.user_fragrances to authenticated;
grant update (status, rating, notes, is_private, added_on)
  on public.user_fragrances to authenticated;

revoke insert, update on public.reviews from anon, authenticated;
grant insert (user_id, fragrance_id, body, longevity, projection, sillage, versatility, value)
  on public.reviews to authenticated;
grant update (body, longevity, projection, sillage, versatility, value)
  on public.reviews to authenticated;

revoke insert, update on public.review_comments from anon, authenticated;
grant insert (review_id, user_id, body) on public.review_comments to authenticated;
grant update (body) on public.review_comments to authenticated;

revoke update on public.review_likes, public.follows, public.list_likes
  from anon, authenticated;

revoke insert, update on public.lists from anon, authenticated;
grant insert (user_id, title, description, cover_image_url, is_public, is_ranked)
  on public.lists to authenticated;
grant update (title, description, cover_image_url, is_public, is_ranked)
  on public.lists to authenticated;

revoke insert, update on public.list_fragrances from anon, authenticated;
grant insert (list_id, fragrance_id, position, note) on public.list_fragrances to authenticated;
grant update (position, note) on public.list_fragrances to authenticated;

-- Anonymous visitors can only read.
revoke insert, update, delete on all tables in schema public from anon;
