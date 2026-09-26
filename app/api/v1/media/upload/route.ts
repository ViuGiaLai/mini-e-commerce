import { hasAdminSession } from "@/lib/server/admin-session";
import { apiData, apiError, apiProblem } from "@/lib/server/api-response";
import {
  inferContentType,
  mediaCategories,
  mediaRules,
  type MediaCategory,
} from "@/lib/media";
import { r2Media } from "@/lib/server/r2";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền tải tệp media.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const movieIdRaw = formData.get("movieId");
    const categoryRaw = formData.get("category");
    const slugRaw = formData.get("slug");

    if (!file || !(file instanceof File)) {
      return apiProblem("Không tìm thấy tệp tải lên.", 400);
    }

    const movieId = Number(movieIdRaw);
    if (!Number.isSafeInteger(movieId) || movieId <= 0) {
      return apiProblem("Mã phim không hợp lệ.", 400);
    }

    const slug = typeof slugRaw === "string" ? slugRaw.trim() : undefined;

    const category = categoryRaw as MediaCategory;
    if (!category || !mediaCategories.includes(category)) {
      return apiProblem("Loại media không hợp lệ.", 400);
    }

    const rule = mediaRules[category];
    if (file.size > rule.maxBytes) {
      return apiProblem(
        `Dung lượng tệp vượt giới hạn cho phép (${Math.round(rule.maxBytes / (1024 * 1024))} MB).`,
        400,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const completed = await r2Media.uploadDirect(
      movieId,
      category,
      file.name,
      buffer,
      inferContentType(file.name, file.type),
      slug,
    );

    return apiData(completed);
  } catch (error) {
    return apiError(error, "Không thể tải tệp lên Cloudflare R2.");
  }
}
