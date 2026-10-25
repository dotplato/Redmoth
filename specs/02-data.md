# 02 — Data (SQLite + Prisma)

## Did
Switched the Prisma datasource from PostgreSQL to SQLite (`file:./dev.db`). Models: User, Creator, Category, Tool, Screenshot, Event. Seed creates an admin user and six published tools with SVG logos/screenshots.

## Solved
Docker Desktop could not install (C: disk space + no WSL). User asked to leave Docker; SQLite unblocks local development without a container.

## Errors
- Postgres `mode: insensitive` search is invalid on SQLite — removed.
- Prisma 8 RC was pulled by `npm install prisma`; pin to Prisma 6 for classic `schema.prisma` migrate.

## Achieves
A local file database you can migrate and seed without Docker.
