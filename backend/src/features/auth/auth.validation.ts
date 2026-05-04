import { z } from "zod";
import { Request, Response, NextFunction } from "express";
// Must stay in sync with passwordSchema in frontend/features/auth/lib/password.ts.
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/**
 * Zod schema for the sign-up request body.
 *
 * Applied as Express middleware before Better Auth sees the request.
 * Better Auth's own password.validate hook does not run on sign-up
 * in the current version — this schema is the source of truth for
 * sign-up validation.
 *
 * callbackURL is optional but validated against FRONTEND_URL when present
 * to prevent open redirect attacks.
 */
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  callbackURL: z
    .string()
    .url("callbackURL must be a valid URL")
    .refine(
      (url) => {
        const trusted = process.env.FRONTEND_URL;
        if (!trusted) return false;
        try {
          const parsed = new URL(url);
          const origin = new URL(trusted);
          return parsed.origin === origin.origin;
        } catch {
          return false;
        }
      },
      { message: "callbackURL must be a trusted origin" }
    )
    .optional(),
});

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}
