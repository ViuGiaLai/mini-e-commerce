import { defaultSettings } from "@/lib/admin-data";
import { hasAdminSession } from "@/lib/server/admin-session";
import { adminRepository } from "@/lib/server/admin-repository";
import { parseSettings } from "@/lib/server/admin-validation";
import { apiData, apiError, apiProblem } from "@/lib/server/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiData((await adminRepository.getSettings()) ?? defaultSettings);
  } catch (error) {
    return apiError(error, "Không thể tải cấu hình hệ thống.");
  }
}

export async function PUT(request: Request) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền thay đổi cấu hình hệ thống.", 401);
  }

  try {
    const settings = parseSettings(await request.json());
    return apiData(await adminRepository.saveSettings(settings));
  } catch (error) {
    return apiError(error, "Không thể lưu cấu hình hệ thống.");
  }
}
