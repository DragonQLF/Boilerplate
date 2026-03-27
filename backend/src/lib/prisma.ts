import { PrismaClient } from "@prisma/client";
import logger from "./logger";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? [{ emit: "event", level: "query" }]
      : [],
});

if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    if (e.duration > 100) {
      // Log duration only — never log the full query string which may
      // contain sensitive user data (email addresses, names, etc.).
      logger.warn(`Slow query detected (${e.duration}ms)`);
    }
  });
}

export default prisma;
