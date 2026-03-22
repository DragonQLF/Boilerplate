// Returns the app's public URL.
// Throws in production if NEXT_PUBLIC_APP_URL is missing so misconfigured
// deployments fail loudly rather than sending emails pointing at localhost.
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_APP_URL must be set in production");
    }
    return "http://localhost:3000";
  }
  return url;
}
