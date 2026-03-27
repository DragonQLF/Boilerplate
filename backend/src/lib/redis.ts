import { createClient } from "redis";
import logger from "./logger";

/**
 * Shared Redis client instance.
 *
 * Used for:
 * - Rate limiting (express-rate-limit RedisStore)
 * - Session blacklisting (instant revocation on sign-out)
 * - Failed login tracking (per-email lockout)
 * - Email send rate limiting (per-address hourly limit)
 *
 * connectRedis() must be called before initializeLimiters() in start().
 * In production, set REDIS_URL to redis://:password@host:6379
 */
const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => logger.error("Redis client error", { err }));

export async function connectRedis(): Promise<void> {
  if (!redis.isOpen) {
    await redis.connect();
    logger.info("Redis connected");
  }
}

export default redis;
