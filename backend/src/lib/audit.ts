import logger from "./logger";

/**
 * Logs security-relevant events to a dedicated AUDIT channel.
 * These entries should be forwarded to a SIEM or long-term log store in production.
 *
 * Events to log: failed_login, successful_login, password_reset_requested,
 * password_changed, email_verified, session_blacklisted, rate_limit_hit.
 */
export function auditLog(
  event: string,
  data: Record<string, unknown>
): void {
  logger.warn(`[AUDIT] ${event}`, { audit: true, event, ...data });
}
