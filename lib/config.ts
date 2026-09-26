export type ApiMode = "mock" | "production";

export const apiMode: ApiMode =
  (process.env.NEXT_PUBLIC_API_MODE ?? "").trim() === "production"
    ? "production"
    : "mock";

export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(
  /\/$/,
  "",
);
