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
 * Validates the session cookie and attaches req.user.
 * Also checks the Redis session blacklist for instantly revoked sessions.
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
      const blacklisted = await isSessionBlacklisted(session.session.token);
      if (blacklisted) {
        auditLog("blacklisted_session_used", {
          userId: session.user.id,
          email: session.user.email,
        });
        res.status(401).json({ error: "Session revoked" });
        return;
      }
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
 * Forces a fresh DB lookup on every call — use on sensitive routes
 * (password change, account deletion) to prevent stale-session attacks.
 * Also checks emailVerified and the session blacklist.
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
      const blacklisted = await isSessionBlacklisted(session.session.token);
      if (blacklisted) {
        auditLog("blacklisted_session_used_on_sensitive_route", {
          userId: session.user.id,
          email: session.user.email,
          path: req.path,
        });
        res.status(401).json({ error: "Session revoked" });
        return;
      }
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
