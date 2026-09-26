import { NextResponse } from "next/server";
import { movieRepository } from "@/lib/server/movie-repository";
import { hasAdminSession } from "@/lib/server/admin-session";
import { apiData, apiError, apiProblem } from "@/lib/server/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiData(await movieRepository.list());
  } catch (error) {
    return apiError(error, "Không thể tải phim.");
  }
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền thay đổi kho phim.", 401);
  }
  try {
    const body = (await request.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is number => Number.isInteger(id) && id > 0)
      : [];

    if (!ids.length) {
      return apiProblem("Danh sách mã phim cần xóa không hợp lệ.", 400);
    }

    return NextResponse.json({
      data: null,
      meta: { removed: await movieRepository.removeMany(ids) },
    });
  } catch (error) {
    return apiError(error, "Không thể xóa danh sách phim.");
  }
}
