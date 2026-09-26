import { hasAdminSession } from "@/lib/server/admin-session";
import { apiData, apiError, apiProblem } from "@/lib/server/api-response";
import { parseUploadRequest, r2Media } from "@/lib/server/r2";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền tải tệp media.", 401);
  }

  try {
    const input = parseUploadRequest(await request.json());
    return apiData(await r2Media.createUpload(input));
  } catch (error) {
    return apiError(error, "Không thể tạo liên kết tải lên R2.");
  }
}
