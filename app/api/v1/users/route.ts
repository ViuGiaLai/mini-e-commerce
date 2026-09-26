import { hasAdminSession } from "@/lib/server/admin-session";
import { adminRepository } from "@/lib/server/admin-repository";
import { apiData, apiError, apiProblem } from "@/lib/server/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền xem danh sách người dùng.", 401);
  }

  try {
    return apiData(await adminRepository.listUsers());
  } catch (error) {
    return apiError(error, "Không thể tải danh sách người dùng.");
  }
}
