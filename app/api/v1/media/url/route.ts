import { apiData, apiError, apiProblem } from "@/lib/server/api-response";
import { r2Media } from "@/lib/server/r2";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return apiProblem("Thiếu đường dẫn tệp media.", 400);

  try {
    return apiData({
      key,
      url: await r2Media.resolve(key),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    return apiError(error, "Không thể tạo liên kết đọc media.");
  }
}
