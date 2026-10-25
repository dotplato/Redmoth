# 01 — Scaffold

## Did
Created a Next.js App Router app (TypeScript, Tailwind v4) named ToolsMade, with a modern light UI (ink + blue accent, Geist, no museum styling).

## Solved
create-next-app rejected the `ToolsMade` folder name (npm no longer allows capitals). Scaffolded as `toolsmade` then moved files to the workspace root.

## Errors
- `npx` missing until Node.js LTS was installed via winget.
- Prisma CLI 8 RC vs client 7 mismatch left for a later pin to Prisma 6.

## Achieves
A runnable Next.js project with the ToolsMade design tokens and room for Prisma + admin.
