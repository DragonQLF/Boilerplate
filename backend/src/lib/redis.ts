import { createClient } from "redis";
import logger from "./logger";

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
