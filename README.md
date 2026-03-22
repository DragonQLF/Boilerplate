# Full-Stack Boilerplate

**Backend:** Node.js · Express · TypeScript · Prisma · PostgreSQL · Better Auth · Winston
**Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Better Auth client

---

## Quick start (development)

```bash
# 1. Start Postgres (and pgAdmin at :5050)
docker-compose -f docker-compose.dev.yml up -d

# 2. Configure backend env
cp backend/.env.example backend/.env
# → fill in BETTER_AUTH_SECRET (any random string for local dev)

# 3. Run migrations and seed
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev          # API at http://localhost:4000

# 4. Configure and start frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev          # UI at http://localhost:3000
```

Test credentials seeded by `db:seed`:

| Field    | Value              |
| -------- | ------------------ |
| Email    | test@example.com   |
| Password | Password123!       |

---

## Production

```bash
# Copy and fill in production secrets
cp backend/.env.example backend/.env

docker-compose -f docker-compose.prod.yml up -d --build
```

Required production env vars (see `backend/.env.example`):

| Variable             | Description                                      |
| -------------------- | ------------------------------------------------ |
| `DATABASE_URL`       | Postgres connection string                       |
| `BETTER_AUTH_SECRET` | Primary signing secret (rotate via `BETTER_AUTH_SECRETS`) |
| `BETTER_AUTH_SECRETS`| Comma-separated old secrets for zero-downtime rotation |
| `FRONTEND_URL`       | Exact origin of the frontend (no trailing slash) |
| `GOOGLE_CLIENT_ID`   | Optional — Google OAuth                          |
| `GOOGLE_CLIENT_SECRET` | Optional — Google OAuth                        |

---

## Project conventions

| Rule | Rationale |
|------|-----------|
| Feature folders are self-contained — routes, controller, service, validation, middleware all inside the feature | Keeps changes localised; nothing leaks into shared layers |
| `lib/` is shared infrastructure only — prisma, logger, ky instance. No business logic | Business logic belongs in features |
| `components/ui/` is shadcn only — all feature UI lives inside `features/` | Prevents shadcn components from growing business logic |
| App pages are thin — only import and render from `features/`, zero logic | Pages are routing shells, not controllers |
| `auth.middleware.ts` is the single source of truth for session protection | All future features import `requireSession` from here |
| Winston everywhere in backend — no `console.log` except seed script | Structured logging, filterable by level and transport |
| All async route handlers use `try/catch` and pass errors to `next(err)` | Centralised error handling via `errorHandler` middleware |
| Zod validates env vars at startup — crash immediately with a clear message | Fails fast before serving traffic with broken config |
| Never trust `NODE_ENV` for security decisions alone | Always use explicit env vars for secrets and origins |
| Multi-stage Docker — dev has bind mounts + hot reload, prod is minimal non-root | Smallest prod attack surface; fast dev iteration |
| Graceful shutdown on both `SIGTERM` and `SIGINT` | Close server, disconnect Prisma, exit cleanly |

---

## Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `GET` | `/api/auth/me` | Returns the authenticated user |
| `POST` | `/api/auth/sign-in/email` | Better Auth — email sign-in |
| `POST` | `/api/auth/sign-up/email` | Better Auth — email sign-up |
| `POST` | `/api/auth/sign-out` | Better Auth — sign-out |
| `GET` | `/api/auth/session` | Better Auth — current session |
