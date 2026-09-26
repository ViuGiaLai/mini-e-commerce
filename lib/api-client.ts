import { apiBaseUrl } from "@/lib/config";

type ApiEnvelope<T> = {
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/**
 * ViuFilm3D API Client - Supports JSON & Multipart FormData
 */
export async function requestApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers = new Headers(init?.headers);
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiRequestError("Không thể kết nối tới backend.", 0);
  }

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new ApiRequestError(
      payload.error || `Backend trả về HTTP ${response.status}.`,
      response.status,
    );
  }

  return payload.data as T;
}
