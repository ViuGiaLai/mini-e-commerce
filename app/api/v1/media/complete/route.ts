import { mediaCategories, mediaRules, type MediaCategory } from "@/lib/media";
import { hasAdminSession } from "@/lib/server/admin-session";
import { apiData, apiError, apiProblem } from "@/lib/server/api-response";
import { ValidationError } from "@/lib/server/errors";
import { assertMediaKey, r2Media } from "@/lib/server/r2";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền xác nhận tệp media.", 401);
  }

  try {
    const body = (await request.json()) as { key?: unknown };
    const key = assertMediaKey(body.key);
    const category = key.split("/")[2] as MediaCategory;
    if (!mediaCategories.includes(category)) {
      throw new ValidationError("Loại tệp trong đường dẫn R2 không hợp lệ.");
    }

    const object = await r2Media.verify(key);
    const rule = mediaRules[category];
    if (object.size <= 0 || object.size > rule.maxBytes) {
      await r2Media.remove(key);
      throw new ValidationError("Dung lượng tệp tải lên không hợp lệ.");
    }
    if (
      object.contentType &&
      !rule.contentTypes.includes(object.contentType.toLowerCase())
    ) {
      await r2Media.remove(key);
      throw new ValidationError("Định dạng tệp tải lên không hợp lệ.");
    }

    return apiData({
      key,
      ...object,
      readUrl: await r2Media.resolve(key),
    });
  } catch (error) {
    return apiError(error, "Không thể xác nhận tệp R2.");
  }
}
