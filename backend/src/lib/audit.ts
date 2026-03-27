import logger from "./logger";

/**
 * Logs security-relevant events to a dedicated AUDIT channel via Winston.
 *
 * Events logged: failed_login, successful_login, password_reset_requested,
 * session_blacklisted, blacklisted_session_used, account_locked_sign_in_blocked,
 * password_reset_rate_limited, verification_email_rate_limited.
 *
 * In production, forward audit logs to a SIEM or long-term log store.
 * Filter by { audit: true } to separate audit entries from application logs.
 */
export function auditLog(
  event: string,
  data: Record<string, unknown>
): void {
  logger.warn(`[AUDIT] ${event}`, { audit: true, event, ...data });
}
