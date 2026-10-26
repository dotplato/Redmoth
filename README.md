# redmoth

A Next.js marketplace for AI tools. Each listing has product info, App Store-style screenshots, and a Visit action that opens the tool’s own site **without adding UTM or referral parameters**.

## Stack

- Next.js App Router, deployed on **Vercel**
- Prisma + **Postgres**
- **Cloudflare R2** for uploaded images (logos, screenshots, avatars)
- Docker Compose for local development

One app serves two domains: the marketplace, and the admin on `ADMIN_HOST` (see `src/middleware.ts`).

## Local development

1. Copy `.env.example` to `.env` and fill in the R2 values (development uses a real bucket) and a random `AUTH_SECRET` (`openssl rand -base64 48`).
2. Start everything:

   ```bash
   docker compose up --build
   ```

   This runs Postgres and the dev server (with hot reload), and applies migrations on start.
3. First run only, load demo data (this **wipes** the database):

   ```bash
   docker compose exec app npm run db:seed
   ```

- Marketplace: [http://localhost:3000](http://localhost:3000)
- Admin: [http://admin.localhost:3000](http://admin.localhost:3000) (add `127.0.0.1 admin.localhost` to your hosts file if it doesn't resolve)

If port 5432 is already used by another Postgres, set `POSTGRES_PORT=5433` in `.env` and use that port in `DATABASE_URL`/`DIRECT_URL`. If port 3000 is taken, set `APP_PORT` (and match it in `ADMIN_HOST`/`PUBLIC_SITE_URL`).

To run Next on your machine instead: `docker compose up db`, then `npm install && npm run dev`.

Schema changes: edit `prisma/schema.prisma`, then `npm run db:migrate -- --name <change>` and commit the new migration.

## Uploads (R2)

Browsers upload images straight to R2: the app hands out a 5-minute presigned PUT URL (`/api/uploads`, or `/api/admin/uploads` on the admin host), then the form posts only the resulting public URL. The server checks that the object exists in the expected folder and is within the size and type limits before saving it. This keeps uploads clear of Vercel's 4.5 MB request body limit.

### Bucket setup

1. Create a bucket (for example `redmoth`).
2. Give it public read access: **Settings → Custom Domains** (recommended, e.g. `cdn.redmoth.com`) or enable the `r2.dev` URL. Put that URL in `R2_PUBLIC_URL`.
3. **Manage API tokens → Create API token** with *Object Read & Write* on this bucket. Use the Access Key ID and Secret Access Key, plus your account ID.
4. **Settings → CORS policy** so browsers can upload:

   ```json
   [
     {
       "AllowedOrigins": ["https://redmoth.com", "https://admin.redmoth.com", "http://localhost:3000", "http://admin.localhost:3000"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

## Deploying

### Database

Use any hosted Postgres (Neon, Supabase, Railway, RDS…).

- `DATABASE_URL`: the **pooled** connection string, with `?sslmode=require` (Supabase pooler: also `&pgbouncer=true`).
- `DIRECT_URL`: the **direct** connection string, used for migrations. Same as `DATABASE_URL` if there's no pooler.

Apply migrations and create the admin from your machine (environment variables override `.env`):

```bash
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npm run db:deploy
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" ADMIN_EMAIL="you@…" ADMIN_PASSWORD="…" npm run db:create-admin
```

Never run `db:seed` or `db:reset` against production: they delete everything.

### Vercel

1. Import the repo. Framework preset: Next.js. The default build works (`postinstall` runs `prisma generate`).
2. Add the variables from `.env.example` under **Settings → Environment Variables**, with production values:
   - `ADMIN_HOST=admin.redmoth.com`
   - `PUBLIC_SITE_URL=https://redmoth.com`
3. **Settings → Domains**: add both `redmoth.com` and `admin.redmoth.com` to the **same project**, and set the DNS records Vercel shows.
4. On each deploy that includes a new migration, run `npm run db:deploy` against production first (as above).

## Visit links

Visit uses `/go/[slug]`, logs a click, then 302-redirects to the stored `websiteUrl` exactly as entered.
