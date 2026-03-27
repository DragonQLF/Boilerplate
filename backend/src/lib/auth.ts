import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { passwordSchema } from "../features/auth/auth.validation";
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

/**
 * Better Auth configuration.
 *
 * Email/password auth with mandatory email verification.
 * Google OAuth is enabled when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
 *
 * Security decisions:
 * - maxPasswordLength is 72 to match bcrypt's silent truncation limit.
 * - password.validate runs on change/reset only — sign-up validation
 *   is handled by Zod in auth.validation.ts (Express middleware).
 * - trustedOrigins is empty in production if FRONTEND_URL is missing,
 *   rather than falling back to a permissive default.
 * - Cookie sameSite is "strict" — prevents CSRF without a separate token.
 * - secondarySecrets enables zero-downtime secret rotation via BETTER_AUTH_SECRETS.
 */
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
          html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#F5F1EB;font-family:'Courier New',monospace;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1EB;padding:2.5rem 1rem;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#F5F1EB;border:1px solid #E0DBD3;"><tr><td style="background:#0C0C0C;padding:1.75rem 2.5rem;border-bottom:3px solid #C8813A;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:Georgia,serif;font-style:italic;font-size:20px;color:#EDE8DE;letter-spacing:-0.02em;">Stack</td><td align="right" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#4A4A4A;">Password Reset</td></tr></table></td></tr><tr><td style="padding:2.5rem 2.5rem 2rem;background:#F5F1EB;"><p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#C8813A;margin:0 0 12px;">Security notice</p><h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#0C0C0C;letter-spacing:-0.025em;line-height:1.15;margin:0 0 20px;">Reset your<br><span style="font-style:italic;font-weight:400;color:#C8813A;">password.</span></h1><div style="height:1px;background:#E0DBD3;margin:24px 0;"></div><p style="font-family:'Courier New',monospace;font-size:13px;color:#1A1A1A;line-height:1.8;margin:0 0 12px;font-weight:300;">Hi ${safeName},</p><p style="font-family:'Courier New',monospace;font-size:12px;color:#4A4A4A;line-height:1.9;font-weight:300;margin:0 0 24px;">We received a request to reset the password for your Stack account. Click the button below to choose a new password.<br><br>This link expires in <strong style="color:#0C0C0C;font-weight:500;">1 hour</strong>. If you didn&#39;t request a reset, no action is needed — your password remains unchanged.</p><table cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr><td style="background:#0C0C0C;padding:14px 32px;"><a href="${url}" style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#EDE8DE;text-decoration:none;">Reset password &#8594;</a></td></tr></table><p style="font-family:'Courier New',monospace;font-size:10px;color:#888;margin:8px 0 0;">Button not working? Copy this link: <span style="color:#C8813A;font-weight:500;">${url}</span></p><div style="background:#EDE8DE;border-left:3px solid #C8813A;padding:12px 16px;margin:24px 0;"><p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#888;margin:0 0 6px;">Reset link</p><p style="font-family:'Courier New',monospace;font-size:10px;color:#C8813A;word-break:break-all;margin:0;font-weight:500;">${url}</p></div><table cellpadding="0" cellspacing="0" style="background:#EDE8DE;border:1px solid #E0DBD3;padding:16px 20px;margin:24px 0 0;width:100%;"><tr><td width="16" style="color:#C8813A;font-size:11px;font-weight:700;font-family:'Courier New',monospace;vertical-align:top;padding-top:2px;">!</td><td style="font-family:'Courier New',monospace;font-size:10px;color:#4A4A4A;line-height:1.75;font-weight:300;padding-left:10px;">If you didn&#39;t request a password reset, please ignore this email. Your account is secure and no changes have been made.</td></tr></table></td></tr><tr><td style="background:#0C0C0C;padding:24px 40px;border-top:1px solid #1E1E1E;"><table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #1E1E1E;padding-bottom:16px;margin-bottom:16px;"><tr><td style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#4A4A4A;">Stack</td><td align="right" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#2E2E2E;">Automated &middot; Do not reply</td></tr></table><p style="font-family:'Courier New',monospace;font-size:9px;color:#2E2E2E;line-height:1.75;font-weight:300;margin:0;">This is an automated message from Stack. You&#39;re receiving this because a password reset was requested for this email address.</p></td></tr></table></td></tr></table></body></html>`,
        });
        auditLog("password_reset_requested", { email: user.email });
      } catch (err) {
        logger.error("Failed to send password reset email:", err);
      }
    },
    // Note: password.validate is not called by Better Auth on sign-up in this version.
    // Password rules are enforced via Express middleware in index.ts using signUpSchema.
    // This validate hook runs on password change/reset only — kept as a defence-in-depth
    // check for those flows. Uses the same passwordSchema as auth.validation.ts.
    password: {
      validate: (password: string) => passwordSchema.safeParse(password).success,
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
          html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#F5F1EB;font-family:'Courier New',monospace;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1EB;padding:2.5rem 1rem;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#F5F1EB;border:1px solid #E0DBD3;"><tr><td style="background:#0C0C0C;padding:1.75rem 2.5rem;border-bottom:3px solid #C8813A;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:Georgia,serif;font-style:italic;font-size:20px;color:#EDE8DE;letter-spacing:-0.02em;">Stack</td><td align="right" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#4A4A4A;">Account Verification</td></tr></table></td></tr><tr><td style="padding:2.5rem 2.5rem 2rem;background:#F5F1EB;"><p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#C8813A;margin:0 0 12px;">Action required</p><h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#0C0C0C;letter-spacing:-0.025em;line-height:1.15;margin:0 0 20px;">Verify your<br><span style="font-style:italic;font-weight:400;color:#C8813A;">email address.</span></h1><div style="height:1px;background:#E0DBD3;margin:24px 0;"></div><p style="font-family:'Courier New',monospace;font-size:13px;color:#1A1A1A;line-height:1.8;margin:0 0 12px;font-weight:300;">Hi ${safeName},</p><p style="font-family:'Courier New',monospace;font-size:12px;color:#4A4A4A;line-height:1.9;font-weight:300;margin:0 0 24px;">Thanks for signing up. To activate your account, please verify your email address by clicking the button below.<br><br>This link expires in <strong style="color:#0C0C0C;font-weight:500;">24 hours</strong>.</p><table cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr><td style="background:#0C0C0C;padding:14px 32px;"><a href="${url}" style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#EDE8DE;text-decoration:none;">Verify email address &#8594;</a></td></tr></table><p style="font-family:'Courier New',monospace;font-size:10px;color:#888;margin:8px 0 0;">Button not working? Copy this link: <span style="color:#C8813A;font-weight:500;">${url}</span></p><div style="background:#EDE8DE;border-left:3px solid #C8813A;padding:12px 16px;margin:24px 0;"><p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#888;margin:0 0 6px;">Verification link</p><p style="font-family:'Courier New',monospace;font-size:10px;color:#C8813A;word-break:break-all;margin:0;font-weight:500;">${url}</p></div><table cellpadding="0" cellspacing="0" style="background:#EDE8DE;border:1px solid #E0DBD3;padding:16px 20px;margin:24px 0 0;width:100%;"><tr><td width="16" style="color:#C8813A;font-size:11px;font-weight:700;font-family:'Courier New',monospace;vertical-align:top;padding-top:2px;">!</td><td style="font-family:'Courier New',monospace;font-size:10px;color:#4A4A4A;line-height:1.75;font-weight:300;padding-left:10px;">If you didn&#39;t create a Stack account, you can safely ignore this email. Someone may have entered your address by mistake.</td></tr></table></td></tr><tr><td style="background:#0C0C0C;padding:24px 40px;border-top:1px solid #1E1E1E;"><table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #1E1E1E;padding-bottom:16px;margin-bottom:16px;"><tr><td style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#4A4A4A;">Stack</td><td align="right" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#2E2E2E;">Automated &middot; Do not reply</td></tr></table><p style="font-family:'Courier New',monospace;font-size:9px;color:#2E2E2E;line-height:1.75;font-weight:300;margin:0;">This is an automated message from Stack. You&#39;re receiving this because someone signed up for an account using this email address.</p></td></tr></table></td></tr></table></body></html>`,
        });
      } catch (err) {
        logger.error("Failed to send verification email:", err);
      }
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
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
      ? process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : []
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
