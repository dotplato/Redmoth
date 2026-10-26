# redmoth

A Next.js marketplace for AI tools. Each listing has product info, App Store-style screenshots, and a Visit action that opens the tool’s own site **without adding UTM or referral parameters**.

## Stack

- Next.js App Router
- Prisma + **SQLite** (local file `prisma/dev.db`)
- Next.js Route Handlers for admin and outbound visit tracking

Docker / Postgres is parked for later. `docker-compose.yml` is unused right now.

## Setup

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

- Marketplace: [http://localhost:3000](http://localhost:3000)
- Admin: [http://admin.localhost:3000](http://admin.localhost:3000)

If `admin.localhost` does not resolve, add `127.0.0.1 admin.localhost` to your hosts file.

Default admin (from `.env`):

- Email: `admin@redmoth.local`
- Password: `admin1234`

## Visit links

Visit uses `/go/[slug]`, logs a click, then 302-redirects to the stored `websiteUrl` exactly as entered.
