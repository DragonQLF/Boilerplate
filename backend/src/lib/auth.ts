import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { sendEmail } from "./email";
import { checkEmailRateLimit } from "../middleware/rateLimiter";
import { auditLog } from "./audit";
import logger from "./logger";

const additionalSecrets = process.env.BETTER_AUTH_SECRETS
  ? process.env.BETTER_AUTH_SECRETS.split(",").filter(Boolean)
  : [];

// Sanitize user-supplied strings before embedding them in HTML to prevent XSS.
// The raw value is kept in the DB; sanitize at the rendering layer, not at storage.
function escapeHtml(str: string): string {
  return str.replace(/[<>"'&]/g, (c) => `&#${c.charCodeAt(0)};`);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // No fallback — BETTER_AUTH_URL is required and validated by Zod at startup.
  baseURL: process.env.BETTER_AUTH_URL as string,
  basePath: "/api/auth",

  secret: process.env.BETTER_AUTH_SECRET,

  ...(additionalSecrets.length > 0 && {
    secondarySecrets: additionalSecrets,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    // Must match the .max(72) in signUpSchema — bcrypt silently truncates at 72 bytes.
    // Setting this here ensures Better Auth's own routes (changePassword, resetPassword)
    // enforce the same limit rather than the default 128.
    maxPasswordLength: 72,
    sendResetPassword: async ({ user, url }) => {
      const allowed = await checkEmailRateLimit(user.email);
      if (!allowed) {
        logger.warn("Reset password email rate limit exceeded", { email: user.email });
        auditLog("password_reset_rate_limited", { email: user.email });
        return;
      }
      const safeName = escapeHtml(user.name);
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          html: `
            <p>Hi ${safeName},</p>
            <p>We received a request to reset your password. Click the link below to choose a new one:</p>
            <p><a href="${url}">Reset password</a></p>
            <p>This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          `,
        });
        auditLog("password_reset_requested", { email: user.email });
      } catch (err) {
        logger.error("Failed to send password reset email:", err);
      }
    },
    // Note: password.validate is not called by Better Auth on sign-up in this version.
    // Password rules are enforced via Express middleware in index.ts using signUpSchema.
    // This validate hook runs on password change/reset only — kept as a defence-in-depth
    // check for those flows.
    password: {
      validate(password: string) {
        if (password.length < 8) return false;
        if (password.length > 72) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[0-9]/.test(password)) return false;
        if (!/[^A-Za-z0-9]/.test(password)) return false;
        return true;
      },
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const allowed = await checkEmailRateLimit(user.email);
      if (!allowed) {
        logger.warn("Verification email rate limit exceeded", { email: user.email });
        auditLog("verification_email_rate_limited", { email: user.email });
        return;
      }
      const safeName = escapeHtml(user.name);
      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your email address",
          html: `
            <p>Hi ${safeName},</p>
            <p>Thanks for signing up. Click the link below to verify your email address:</p>
            <p><a href="${url}">Verify email</a></p>
            <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
          `,
        });
      } catch (err) {
        logger.error("Failed to send verification email:", err);
      }
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,   // 7 days
    updateAge: 60 * 60 * 24,         // refresh if older than 1 day
  },

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  // Safe access — FRONTEND_URL is required and validated by Zod at startup.
  // Avoid non-null assertion (!) which would pass `undefined` to Better Auth
  // if the var were missing, silently accepting any origin.
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
      : ["http://localhost:3000"],

  advanced: {
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict" as const,
        },
      },
    },
  },
});
