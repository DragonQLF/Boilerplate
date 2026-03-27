"use client";

import { authClient } from "../lib/auth-client";

/**
 * Returns the current authenticated user and session state.
 *
 * Wraps Better Auth's useSession hook to provide a single, stable
 * import point across the app. Prefer this over importing authClient
 * directly in components.
 *
 * Returns:
 * - user          — the authenticated user, or null if not signed in
 * - isLoading     — true while the session is being fetched
 * - isAuthenticated — true if a user is present
 * - error         — any session fetch error
 */
export function useSession() {
  const { data: session, isPending, error } = authClient.useSession();

  return {
    user: session?.user ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error,
  };
}
