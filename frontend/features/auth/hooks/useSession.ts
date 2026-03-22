"use client";

import { authClient } from "../lib/auth-client";

/**
 * Returns the current session, a loading flag, and the raw session data.
 * Wraps Better Auth's built-in hook to provide a single import point.
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
