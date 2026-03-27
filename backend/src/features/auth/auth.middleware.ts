import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../lib/auth";
import { isSessionBlacklisted } from "../../middleware/rateLimiter";
import { auditLog } from "../../lib/audit";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

/**
 * Checks whether a session token has been blacklisted in Redis.
 * Called by both requireSession and sensitiveAction to avoid duplication.
 * Returns true and sends a 401 if blacklisted, false otherwise.
 */
async function checkBlacklist(
  token: string,
  user: { id: string; email: string },
  res: Response
): Promise<boolean> {
  const blacklisted = await isSessionBlacklisted(token);
  if (blacklisted) {
    auditLog("blacklisted_session_used", { userId: user.id, email: user.email });
    res.status(401).json({ error: "Session revoked" });
    return true;
  }
  return false;
}

/**
 * Standard session guard — use on all protected routes.
 *
 * 1. Validates the session cookie via Better Auth.
 * 2. Checks the Redis blacklist for instantly revoked sessions.
 * 3. Ensures the user's email is verified.
 * 4. Attaches req.user for downstream handlers.
 *
 * Uses Better Auth's cookie cache for performance.
 * For sensitive operations, use sensitiveAction instead.
 */
export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check if this session token has been blacklisted (instant revocation).
    if (session.session?.token) {
      if (await checkBlacklist(session.session.token, session.user, res)) return;
    }

    if (!session.user.emailVerified) {
      res.status(403).json({ error: "Email not verified" });
      return;
    }

    req.user = session.user;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * Strict session guard — use on sensitive routes (password change, account deletion, payments).
 *
 * Same as requireSession but forces a fresh database lookup by disabling
 * Better Auth's cookie cache. This prevents stale-session attacks where
 * a cached session could be used after the underlying DB record was invalidated.
 */
export async function sensitiveAction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
      query: { disableCookieCache: true },
    });

    if (!session?.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (session.session?.token) {
      if (await checkBlacklist(session.session.token, session.user, res)) return;
    }

    if (!session.user.emailVerified) {
      res.status(403).json({ error: "Email not verified" });
      return;
    }

    req.user = session.user;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
