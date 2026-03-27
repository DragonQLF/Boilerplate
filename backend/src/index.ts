import "dotenv/config";
import { z } from "zod";

// ── 1. Validate env vars before anything else ────────────────────────────────
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  FRONTEND_URL: z.string().url(),
  PORT: z.string().default("4000"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address"),
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL"),
  EMAIL_RATE_LIMIT_PER_HOUR: z.string().default("5"),
});

const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
  console.error("Missing required environment variables:", envResult.error.flatten().fieldErrors);
  process.exit(1);
}

const env = envResult.data;

// ── 2. App imports (after env is validated) ───────────────────────────────────
import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";

import { auth } from "./lib/auth";
import logger from "./lib/logger";
import prisma from "./lib/prisma";
import { connectRedis, default as redis } from "./lib/redis";
import {
  initializeLimiters,
  authLimiter,
  globalLimiter,
  isEmailLocked,
  isSessionBlacklisted,
  trackFailedLogin,
  resetFailedLogins,
  blacklistSession,
} from "./middleware/rateLimiter";
import { auditLog } from "./lib/audit";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./features/auth/auth.routes";
import { validate, signUpSchema } from "./features/auth/auth.validation";

const app = express();

// ── 3. Security & parsing middleware ─────────────────────────────────────────
app.disable("x-powered-by");

// Only trust the reverse proxy in production — in dev there is no proxy,
// so unconditional trust allows any client to spoof X-Forwarded-For
// and bypass IP-based rate limiting.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "10kb" }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
);
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(hpp());
app.use(globalLimiter);

// ── Request logging ───────────────────────────────────────────────────────────
// /health is excluded — it is polled every 10s by Docker and would flood the logs.
app.use((req, _res, next) => {
  if (req.path !== "/health") {
    logger.info(`${req.method} ${req.path}`);
  }
  next();
});

// ── 4. Better Auth — must come before custom /api/auth routes ────────────────
// Blacklist check for /api/auth/session — Better Auth's own session endpoint
// bypasses requireSession middleware, so a signed-out token could still return
// valid user data. This pre-handler closes that gap.
app.get("/api/auth/session", async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (session?.session?.token) {
      const blacklisted = await isSessionBlacklisted(session.session.token);
      if (blacklisted) {
        res.status(401).json({ error: "Session revoked" });
        return;
      }
    }
  } catch {
    // non-fatal — let Better Auth handle it
  }
  next();
});

// Block session listing — not needed and leaks session metadata.
app.get("/api/auth/list-sessions", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Session revocation is disabled — Better Auth applies no ownership check,
// meaning any authenticated user could revoke any other user's session.
// Remove this block only after adding your own ownership validation.
app.post("/api/auth/revoke-session", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Session blacklisting on sign-out ─────────────────────────────────────────
// Better Auth deletes the session row on sign-out, but without blacklisting
// a token that was copied before sign-out remains valid until cache expiry.
// We grab the token before Better Auth deletes it and write it to Redis.
app.post("/api/auth/sign-out", async (req, _res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (session?.session?.token && session.session.expiresAt) {
      await blacklistSession(session.session.token, session.session.expiresAt).catch(() => {}); // non-fatal — sign-out proceeds regardless
      auditLog("session_blacklisted", {
        userId: session.user?.id,
        email: session.user?.email,
        ip: req.ip ?? "unknown",
      });
    }
  } catch {
    // non-fatal — do not block sign-out if session lookup fails
  }
  next();
});

// ── Per-email failed login tracking ──────────────────────────────────────────
// Closes the gap where an attacker uses many IPs (each under the IP rate limit)
// to spray attempts against a single account.
app.post("/api/auth/sign-in/email", authLimiter, async (req, res, next) => {
  const email = req.body?.email as string | undefined;
  const ip = req.ip ?? "unknown";

  if (email) {
    const locked = await isEmailLocked(email).catch(() => false);
    if (locked) {
      auditLog("account_locked_sign_in_blocked", { email, ip });
      res.status(429).json({
        error: "Too many failed attempts. Please try again in 15 minutes.",
      });
      return;
    }

    // After Better Auth processes the request, track success or failure.
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resetFailedLogins(email).catch(() => {});
        auditLog("successful_login", { email, ip });
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        trackFailedLogin(email)
          .then((count) => {
            auditLog("failed_login", { email, ip, failedCount: count });
          })
          .catch(() => {});
      }
    });
  }

  next();
});

// Apply authLimiter to password reset endpoints — they are brute-force targets
// and must not fall through to the looser globalLimiter (100/15min).
app.post("/api/auth/forget-password", authLimiter);
app.post("/api/auth/reset-password", authLimiter);

// Enforce password rules before Better Auth sees the request.
// Better Auth's password.validate hook is not called on sign-up in this version.
app.post("/api/auth/sign-up/email", authLimiter, validate(signUpSchema));
app.all("/api/auth/*splat", toNodeHandler(auth));
// ── 5. Feature routes ─────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── 6. Health check ───────────────────────────────────────────────────────────
// Returns no timestamp — leaks server clock and adds no value to load balancers.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── 7. 404 / error handlers (must be last) ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── 8. Start server ───────────────────────────────────────────────────────────
const PORT = parseInt(env.PORT, 10);

async function start() {
  await connectRedis();
  initializeLimiters();

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  // ── 9. Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      logger.info("Server shut down gracefully");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
