# SCENTLOG

_A diary of fragrance._ A social platform for perfume lovers.

## Requirements

- Node.js 22 LTS — https://nodejs.org
- Git
- Docker Desktop (only for running Supabase locally) — https://www.docker.com/products/docker-desktop

## First-time setup

```bash
git clone <your-repo-url> scentlog
cd scentlog
npm install
cp .env.example .env.local
```

### Option A — Local Supabase (recommended for development)

```bash
npm run db:start      # starts Postgres, Auth and Storage in Docker; prints the keys
```

Copy `API_URL` → `NEXT_PUBLIC_SUPABASE_URL` and `PUBLISHABLE_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` into `.env.local`. Migrations and `supabase/seed.sql` are applied automatically.

### Option B — Hosted Supabase project

1. Create a project at https://supabase.com/dashboard.
2. In **Project Settings → API Keys**, copy the Project URL and the **Publishable** key into `.env.local`.
3. Link the project and apply migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npm run db:push -- --include-seed
   ```

Never put the **secret** key in `.env.local` with a `NEXT_PUBLIC_` prefix, and never commit `.env.local`.

## Everyday commands

| Command            | What it does                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `npm run dev`      | Start the app at http://localhost:3000                                                                       |
| `npm run check`    | Type check + lint + format check                                                                             |
| `npm run build`    | Production build                                                                                             |
| `npm run db:reset` | Rebuild the **local** database from migrations + seed (deletes local data)                                   |
| `npm run db:test`  | Run database security tests (pgTAP)                                                                          |
| `npm run db:types` | Regenerate `src/types/database.ts` after a schema change                                                     |
| `npm run test:e2e` | Browser tests: auth, catalogue, diary, social, lists, account, SEO, accessibility (needs `npm run db:start`) |

## Project structure

```
src/app/[locale]/     pages (one URL tree per language: /en, /es)
src/components/       ui/ (primitives), layout/, fragrance/
src/features/         data access + logic per domain (fragrances, reviews…)
src/i18n/             language routing; src/messages/ holds the texts
src/lib/supabase/     Supabase clients (browser, server, proxy)
src/proxy.ts          runs before each request: language + session refresh
supabase/migrations/  versioned database changes
supabase/tests/       database tests
docs/decisions.md     why things are built the way they are
```

## Supabase Auth settings (hosted project)

In the Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` (change to the real domain at launch)
- **Redirect URLs:** add `http://localhost:3000/**`

Local test emails can be read in Mailpit at http://127.0.0.1:54324.

## Making yourself an admin

Admins can upload fragrance images from the fragrance page. In the Supabase dashboard → **SQL Editor**, run (replace the username):

```sql
update public.profiles set is_admin = true where username = 'your_username';
```

## Deployment

See **docs/despliegue.md** (Spanish, step by step): Supabase URLs, custom SMTP (Resend), email templates, Vercel environment variables and domain.
