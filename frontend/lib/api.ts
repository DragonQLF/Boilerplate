import ky, { type HTTPError } from "ky";

/**
 * Pre-configured ky HTTP client for backend API calls.
 *
 * - prefixUrl points to NEXT_PUBLIC_API_URL so all calls use relative paths.
 * - credentials: "include" sends the Better Auth session cookie automatically.
 * - afterResponse hook logs non-OK responses in development for easier debugging.
 *
 * Usage:
 *   const data = await api.get("your-feature/endpoint").json<YourType>();
 *   const result = await api.post("your-feature/endpoint", { json: body }).json<YourType>();
 */
export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include",
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        if (!response.ok && process.env.NODE_ENV === "development") {
          let body: unknown;
          try {
            body = await response.clone().json();
          } catch {
            body = await response.clone().text();
          }
          console.error(`[api] ${response.status} ${response.url}`, body);
        }
        return response;
      },
    ],
    beforeError: [
      (error: HTTPError) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[api] request error:", error.message);
        }
        return error;
      },
    ],
  },
});
