import { hasAdminSession } from "@/lib/server/admin-session";
import { apiData, apiError, apiProblem } from "@/lib/server/api-response";
import { r2Media } from "@/lib/server/r2";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền xem kho media.", 401);
  }

  try {
    const params = new URL(request.url).searchParams;
    const prefix = params.get("prefix") ?? "movies/";
    if (!prefix.startsWith("movies/") || prefix.includes("..")) {
      return apiProblem("Tiền tố đường dẫn media không hợp lệ.", 400);
    }
    return apiData(
      await r2Media.list(prefix, params.get("cursor") ?? undefined),
    );
  } catch (error) {
    return apiError(error, "Không thể tải danh sách media.");
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền xóa media.", 401);
  }

  try {
    const body = (await request.json()) as { key?: unknown };
    await r2Media.remove(String(body.key ?? ""));
    return apiData(null);
  } catch (error) {
    return apiError(error, "Không thể xóa media.");
  }
}
