import { PrismaClient } from "@prisma/client";
import { createAuthClient } from "better-auth/client";

const prisma = new PrismaClient();

const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
  basePath: "/api/auth",
});

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.log("Seed skipped — never run seed in production.");
    return;
  }

  console.log("Seeding database...");

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });

  if (existing) {
    console.log("Test user already exists, skipping seed.");
    return;
  }

  const { error } = await authClient.signUp.email({
    name: "Test User",
    email: "test@example.com",
    password: "Password123!",
  });

  if (error) {
    throw new Error(`Seed failed: ${error.message}`);
  }

  console.log("Seeding complete. Test user: test@example.com");
  // Never log passwords, even test ones — sets a bad example for future scripts.
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
