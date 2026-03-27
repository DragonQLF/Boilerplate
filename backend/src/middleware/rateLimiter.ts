import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { RequestHandler, Request, Response, NextFunction } from "express";
import redis from "../lib/redis";

// ── Store factory ─────────────────────────────────────────────────────────────
// Only called after Redis is connected — never at module load time.
const makeStore = (prefix: string) =>
  new RedisStore({
    prefix,
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  });

// ── Internal limiter instances ────────────────────────────────────────────────
// Undefined until initializeLimiters() is called in start().
let _globalLimiter: RateLimitRequestHandler | undefined;
let _authLimiter: RateLimitRequestHandler | undefined;
let _apiLimiter: RateLimitRequestHandler | undefined;

/**
 * Initialises Redis-backed rate limiters.
 * Must be called after connectRedis() in start().
 *
 * Three limiters with separate Redis key namespaces:
 * - globalLimiter  — applied to all routes (100 req / 15 min)
 * - authLimiter    — applied to sign-in, sign-up, password reset (10 req / 15 min)
 * - apiLimiter     — applied to authenticated API routes (60 req / 15 min)
 *
 * Additional per-email protections (not express-rate-limit):
 * - checkEmailRateLimit  — max emails per address per hour (default 5)
 * - trackFailedLogin     — locks account after 10 failures in 15 min
 * - blacklistSession     — instantly revokes a session token in Redis
 */
export function initializeLimiters(): void {
  _globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("rl:global:"),
    message: { error: "Too many requests, please try again later." },
  });

  _authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("rl:auth:"),
    message: { error: "Too many auth attempts, please try again later." },
  });

  _apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("rl:api:"),
    message: { error: "Too many requests, please try again later." },
  });
}

// ── Guard helper ──────────────────────────────────────────────────────────────
// Returns 503 if a request somehow arrives before initializeLimiters() runs,
// rather than throwing a TypeError on undefined().
function notReady(res: Response): void {
  res.status(503).json({ error: "Service not ready" });
}

// ── Proxy wrappers ────────────────────────────────────────────────────────────
// Stable exports safe to import before Redis connects.
// They delegate to the real limiter once initializeLimiters() has been called.
export const globalLimiter: RequestHandler = (req: Request, res: Response, next: NextFunction) =>
  _globalLimiter ? _globalLimiter(req, res, next) : notReady(res);

export const authLimiter: RequestHandler = (req: Request, res: Response, next: NextFunction) =>
  _authLimiter ? _authLimiter(req, res, next) : notReady(res);

export const apiLimiter: RequestHandler = (req: Request, res: Response, next: NextFunction) =>
  _apiLimiter ? _apiLimiter(req, res, next) : notReady(res);

// ── Email send rate limiting per address ──────────────────────────────────────
const EMAIL_RATE_LIMIT = parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR ?? "5", 10);

export async function checkEmailRateLimit(email: string): Promise<boolean> {
  const key = `email-sends:${email.toLowerCase()}`;
  // Atomic pipeline: INCR then SET expiry only if key has no TTL yet (NX).
  // Avoids the race where a crash between INCR and EXPIRE leaves a permanent key.
  const [count] = (await redis.multi().incr(key).expire(key, 3600, "NX").exec()) as [
    number,
    number,
  ];
  return count <= EMAIL_RATE_LIMIT;
}

// ── Failed login tracking per email ──────────────────────────────────────────
const MAX_FAILED_LOGINS = 10;
const FAILED_LOGIN_WINDOW_SECS = 15 * 60;

async function getFailedLoginCount(email: string): Promise<number> {
  const val = await redis.get(`failed-logins:${email.toLowerCase()}`);
  return parseInt(val ?? "0", 10);
}

export async function trackFailedLogin(email: string): Promise<number> {
  const key = `failed-logins:${email.toLowerCase()}`;
  // Atomic pipeline: INCR then SET expiry only if key has no TTL yet (NX).
  const [count] = (await redis
    .multi()
    .incr(key)
    .expire(key, FAILED_LOGIN_WINDOW_SECS, "NX")
    .exec()) as [number, number];
  return count;
}

export async function resetFailedLogins(email: string): Promise<void> {
  await redis.del(`failed-logins:${email.toLowerCase()}`);
}

export async function isEmailLocked(email: string): Promise<boolean> {
  return (await getFailedLoginCount(email)) >= MAX_FAILED_LOGINS;
}

// ── Session blacklist ─────────────────────────────────────────────────────────
export async function blacklistSession(token: string, expiresAt: Date): Promise<void> {
  const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
  if (ttl > 0) {
    await redis.set(`blacklist:${token}`, "1", { EX: ttl });
  }
}

export async function isSessionBlacklisted(token: string): Promise<boolean> {
  const result = await redis.get(`blacklist:${token}`);
  return result === "1";
}
