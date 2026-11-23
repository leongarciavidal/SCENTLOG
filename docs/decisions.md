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
