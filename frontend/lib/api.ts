import ky, { type HTTPError } from "ky";

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
