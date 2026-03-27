# Full-Stack Boilerplate

**Backend:** Node.js 24 · Express 5 · TypeScript · Prisma · PostgreSQL · Better Auth · Redis · Winston  
**Frontend:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Better Auth client

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Express 5, TypeScript, Node.js 24 |
| Auth | Better Auth 1.5 (email/password + Google OAuth) |
| Database | PostgreSQL 17 (Prisma ORM) |
| Cache / Rate limiting | Redis 7 |
| Email | Resend |
| Logging | Winston |
| Containerisation | Docker + Docker Compose |

---

## Quick Start (Development)

**Prerequisites:** Docker Desktop

```bash
# 1. Clone and enter the project
git clone <your-repo-url>
cd Boilerplate

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Fill in BETTER_AUTH_SECRET (any 32+ character string for local dev)
# Fill in RESEND_API_KEY and EMAIL_FROM if you want emails to work

# 3. Configure frontend environment
cp frontend/.env.local.example frontend/.env.local

# 4. Start all services
docker-compose -f docker-compose.dev.yml up -d --build

# 5. Run database migrations
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# 6. Seed the test user
docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| pgAdmin | http://localhost:5050 |

**Test credentials (seeded):**

| Field | Value |
|-------|-------|
| Email | test@example.com |
| Password | Password123! |

> **Note:** The test user's email is not verified by default. Either set up Resend to receive the verification email, or manually verify via pgAdmin / psql:
> ```sql
> UPDATE "user" SET "emailVerified" = true WHERE email = 'test@example.com';
> ```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | Signing secret — minimum 32 characters |
| `BETTER_AUTH_URL` | ✅ | Full URL of the backend API (e.g. `http://localhost:4000`) |
| `FRONTEND_URL` | ✅ | Full URL of the frontend (e.g. `http://localhost:3000`) |
| `REDIS_URL` | ✅ | Redis connection string |
| `RESEND_API_KEY` | ✅ | Resend API key for sending emails |
| `EMAIL_FROM` | ✅ | Sender email address (e.g. `noreply@yourdomain.com`) |
| `PORT` | ❌ | Server port (default: `4000`) |
| `LOG_LEVEL` | ❌ | Winston log level (default: `info`) |
| `EMAIL_RATE_LIMIT_PER_HOUR` | ❌ | Max emails per address per hour (default: `5`) |
| `BETTER_AUTH_SECRETS` | ❌ | Comma-separated old secrets for zero-downtime rotation |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL (e.g. `http://localhost:4000`) |

---

## Project Structure

```
Boilerplate/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.ts              # Test data seeder
│   └── src/
│       ├── features/
│       │   └── auth/
│       │       ├── auth.controller.ts   # Route handlers
│       │       ├── auth.middleware.ts   # requireSession, sensitiveAction
│       │       ├── auth.routes.ts       # Express router
│       │       ├── auth.service.ts      # DB queries
│       │       └── auth.validation.ts   # Zod schemas
│       ├── lib/
│       │   ├── auth.ts          # Better Auth config
│       │   ├── audit.ts         # Security audit logging
│       │   ├── email.ts         # Resend email helper
│       │   ├── logger.ts        # Winston logger
│       │   ├── prisma.ts        # Prisma client
│       │   └── redis.ts         # Redis client
│       ├── middleware/
│       │   ├── errorHandler.ts  # Global error handler
│       │   ├── notFound.ts      # 404 handler
│       │   └── rateLimiter.ts   # Redis-backed rate limiters
│       └── index.ts             # App entry point
├── frontend/
│   ├── app/
│   │   ├── (auth)/              # Route group — URLs stay clean (/login, /register)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   └── dashboard/
│   ├── components/ui/           # shadcn/ui primitives (owned code)
│   ├── features/
│   │   └── auth/
│   │       ├── components/      # Auth form components
│   │       ├── hooks/           # useSession hook
│   │       └── lib/             # Better Auth client
│   └── lib/
│       ├── api.ts               # ky HTTP client instance
│       ├── getAppUrl.ts         # URL helper
│       └── utils.ts             # cn() Tailwind helper
├── docker-compose.dev.yml       # Development stack
└── docker-compose.prod.yml      # Production stack
```

---

## Adding a New Feature

Follow this pattern for every new feature:

**1. Backend — create a feature folder:**
```
backend/src/features/your-feature/
├── your-feature.controller.ts
├── your-feature.middleware.ts  (if needed)
├── your-feature.routes.ts
├── your-feature.service.ts
└── your-feature.validation.ts
```

**2. Backend — protect routes with `requireSession`:**
```ts
import { requireSession } from "../auth/auth.middleware";
import { apiLimiter } from "../../middleware/rateLimiter";

router.use(apiLimiter);
router.get("/your-endpoint", requireSession, yourController);
```

**3. Backend — register in `index.ts`:**
```ts
import yourRoutes from "./features/your-feature/your-feature.routes";
app.use("/api/your-feature", yourRoutes);
```

**4. Frontend — add pages under `app/` and feature components under `features/`:**
```
frontend/features/your-feature/
├── components/
└── hooks/
```

**5. Frontend — call the backend via the `api` client:**
```ts
import { api } from "@/lib/api";

const data = await api.get("your-feature/endpoint").json<YourType>();
```

---

## Conventions

| Rule | Reason |
|------|--------|
| Feature folders are self-contained | Changes stay localised |
| `lib/` is shared infrastructure only — no business logic | Business logic belongs in features |
| `components/ui/` is shadcn only — feature UI lives in `features/` | Prevents shadcn components from growing business logic |
| App pages are thin — only import from `features/`, zero logic | Pages are routing shells, not controllers |
| `requireSession` is the single source of truth for session protection | All features import from here |
| Winston everywhere in backend — no `console.log` | Structured logging, filterable by level |
| All async route handlers use try/catch and pass errors to `next(err)` | Centralised error handling |
| Zod validates env vars at startup | Fails fast before serving traffic with broken config |
| Never `npm install` locally — always inside Docker | Prevents native binary mismatches (LightningCSS etc.) |

---

## Production

```bash
# Fill in production secrets (see Environment Variables above)
# Never use .env files in production — inject via your platform's secrets manager

docker-compose -f docker-compose.prod.yml up -d --build
```

**Required production env vars:**

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Managed Postgres recommended (Neon, Supabase, Railway) |
| `BETTER_AUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Your backend's public URL |
| `FRONTEND_URL` | Your frontend's public URL |
| `REDIS_URL` | Include password: `redis://:password@host:6379` |
| `REDIS_PASSWORD` | Used by docker-compose.prod.yml |
| `RESEND_API_KEY` | From resend.com |
| `EMAIL_FROM` | Must be a verified domain in Resend |
| `POSTGRES_USER` | Used by docker-compose.prod.yml |
| `POSTGRES_PASSWORD` | Used by docker-compose.prod.yml |
| `POSTGRES_DB` | Used by docker-compose.prod.yml |

---

## Secret Rotation

Better Auth supports zero-downtime secret rotation via `BETTER_AUTH_SECRETS`:

```bash
# Add the old secret to BETTER_AUTH_SECRETS, set the new one as BETTER_AUTH_SECRET
BETTER_AUTH_SECRET=new-secret-here
BETTER_AUTH_SECRETS=old-secret-1,old-secret-2
```

Existing sessions signed with old secrets remain valid during the transition.

---

## Rate Limits

| Limiter | Routes | Limit |
|---------|--------|-------|
| `globalLimiter` | All routes | 100 req / 15 min |
| `authLimiter` | Sign-in, sign-up, password reset | 10 req / 15 min |
| `apiLimiter` | Authenticated API routes | 60 req / 15 min |
| Email limiter | Verification + reset emails | 5 emails / hour (configurable) |
| Failed login lockout | Per email address | Locked after 10 failures / 15 min |
