# Technical decisions

A short log of the important choices and why they were made.

## 2026-11 — Milestone 1

**Stack.** Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS 4, Supabase (Postgres, Auth, Storage). Deployment target: Vercel.

**Internationalisation: next-intl, locale always in the URL (`/en`, `/es`).** Each language has its own URL, so pages can be shared and indexed per language. Visiting `/` redirects using the saved cookie or the browser language. UI strings live in `src/messages/{en,es}.json` and are type-checked, so a missing key fails the build. Catalogue labels that need translating (families, notes, descriptions) use `_en` / `_es` columns in the database.

**`src/proxy.ts` (called Middleware before Next 16).** It runs the i18n routing first and then refreshes the Supabase session cookies on the same response.

**Supabase keys.** Only the _publishable_ key (`sb_publishable_…`) is used by the app. Authorisation is enforced by Row Level Security in Postgres, never by hiding things in the UI. The _secret_ key is never used in app code.

**Server-side identity.** Use `supabase.auth.getClaims()` or `getUser()`, which verify the JWT. Never trust `getSession()` on the server.

**One rating per user per fragrance.** The star rating lives in `user_fragrances` (the diary entry). A review needs a diary entry (composite FK) and adds text plus optional dimensions (longevity, projection, sillage, versatility, value, each 1–5). The community average is computed from diary ratings by a trigger. This avoids two ratings for the same fragrance that could disagree.

**Counters maintained by triggers** (`rating_avg`, `review_count`, `like_count`, `item_count`…). They are fast to read and sort. Column-level `GRANT`s stop users from writing them directly.

**Activity feed written only by triggers.** Users cannot forge events. Events for private diary entries or private lists are never created, and they are removed if the item becomes private.

**Concentrations and flankers are separate fragrance rows.** An optional `parent_id` links them to the original. Uniqueness is (brand, name, concentration, year).

**Images.** No third-party images are scraped or hot-linked (e.g. from Fragrantica). That would breach copyright and the sites' terms. Without a photo, the UI renders a typographic label. Real images will be uploaded to Supabase Storage (`fragrance-images` bucket, admin-only writes) from sources we have the right to use, with an `image_credit` column.

**Cache Components disabled for now.** The template enables `cacheComponents`. We turned it off to keep the rendering model simple while the core features are built. We will revisit it in Milestone 7 (performance).

**Database tests.** Run with pgTAP (`npm run db:test`) against the local Supabase stack. They cover RLS, constraints and triggers.

**Explicit privileges on every table.** New Supabase projects do not grant table privileges to `anon` / `authenticated` automatically, and the first deploy failed with `permission denied`. Since migration `20261123120000_explicit_grants.sql`, every privilege is granted explicitly. Every future table must grant its own privileges in its migration. RLS still decides which rows each user can access.

## 2026-11 — Milestone 2 (authentication and profiles)

**Server Actions for every form** (sign up, sign in, profile…). Each input is validated with Zod on the server and errors come back as codes that the UI translates. The forms still work if JavaScript fails to load.

**Identity on the server comes from `getClaims()`** (`features/auth/session.ts`), cached once per request. Protected pages call `requireUser()`, which redirects to `/login?next=…`. `next` only accepts relative paths, which prevents open redirects.

**Email links land on `/auth/confirm`.** It handles both the default PKCE format (`?code=`) and the `token_hash` format, so we can customise the email templates later without code changes.

**Username availability is checked before sign-up** for instant feedback. The unique constraint and the `handle_new_user` trigger are the real guarantee: if a race happens, the trigger assigns a safe fallback the user can change.

**Avatars are resized to 512×512 in the browser** before upload. This keeps them small and under the 1 MB Server Action limit. The server still checks type and size. Files live in `avatars/<user id>/`, and old files are deleted on each change. A storage SELECT policy (owner's folder only) was added so listing and deleting work.

**No account enumeration.** Sign-up and password-reset responses never reveal whether an email is registered.

**Local auth mirrors production.** `supabase/config.toml` has email confirmation on and an 8-character minimum password. Confirmation emails go to Mailpit, and the e2e tests read them from there.

## 2026-11 — Milestone 3 (catalogue)

**Search uses a `search_text` column.** It holds the fragrance name plus the brand name, lower-case and without accents (`public.normalize_search`). A trigger keeps it up to date, and a trigram index keeps `ILIKE '%…%'` fast. "hermes" finds "Hermès". Postgres can grow into full-text or fuzzy ranking later without changing the UI.

**The catalogue is a plain GET form.** Each search and filter combination has its own shareable URL and works without JavaScript. With JavaScript, changing a select submits the form straight away. Invalid query values are ignored instead of failing.

**Note, family, brand and perfumer links feed the catalogue filters.** For example, clicking "Iris" in a notes pyramid opens `/fragrances?note=iris`.

**Editions.** A fragrance page lists its original (`parent_id`), its siblings and its children as "Other editions".

**Admin role (`profiles.is_admin`).** Admins can change only a fragrance's image and image credit from the app. This is enforced by RLS, column grants and storage policies, all tested. Users cannot grant themselves the role. It is set from the Supabase SQL editor. A credit is required for every image.

**Images from local Supabase (127.0.0.1)** skip Next's optimiser, which blocks private IPs for security. Images from hosted Supabase are optimised normally.

**Brand countries are ISO codes (`FR`)**, shown in the user's language with `Intl.DisplayNames`.

## 2026-11 — Milestone 4 (personal diary)

**One diary entry per user and fragrance**, holding status (owned, tested, wishlist, finished), an optional 0.5–5 rating, private notes, a date and a private flag. Saving checks whether the entry exists, then updates it or inserts it. An upsert is not used because it would also try to write `user_id` / `fragrance_id`, which users have no permission to change.

**The rating input uses real radio buttons** (two halves per star). It works with keyboard arrows, screen readers and without JavaScript.

**Private entries** are hidden by RLS from everyone but their owner. That covers collections, stats and activity, and the tests check it.

**The top four is saved through the RPC `set_profile_favorites(uuid[])`.** It replaces the list atomically (max 4, no duplicates) and runs as the caller, so RLS applies.

**Collections live at `/[username]/collection`**, with status tabs and sorting. The diary stats on a profile link to the matching tab.

**Numbers use each language's format** ("4,5" in Spanish, "4.5" in English) through next-intl.
