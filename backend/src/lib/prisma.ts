import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? [{ emit: "event", level: "query" }]
      : [],
});

if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    if (e.duration > 200) {
      // Log duration only — never log the full query string which may
      // contain sensitive user data (email addresses, names, etc.).
      import("./logger").then(({ default: logger }) => {
        logger.warn(`Slow query detected (${e.duration}ms)`);
      });
    }
  });
}

export default prisma;
