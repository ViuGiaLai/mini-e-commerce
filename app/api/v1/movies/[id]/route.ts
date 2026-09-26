import { movieRepository } from "@/lib/server/movie-repository";
import { parseMovie } from "@/lib/server/movie-validation";
import { hasAdminSession } from "@/lib/server/admin-session";
import { apiData, apiError, apiProblem } from "@/lib/server/api-response";
import { ValidationError } from "@/lib/server/errors";

type MovieRouteContext = { params: Promise<{ id: string }> };

const readId = async (context: MovieRouteContext) => {
  const { id } = await context.params;
  const parsed = Number(id);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ValidationError("Mã phim không hợp lệ.");
  }
  return parsed;
};

export async function GET(_: Request, context: MovieRouteContext) {
  try {
    const id = await readId(context);
    const movie = await movieRepository.find(id);
    return movie ? apiData(movie) : apiProblem("Không tìm thấy phim.", 404);
  } catch (error) {
    return apiError(error, "Không thể tải thông tin phim.");
  }
}

export async function PUT(request: Request, context: MovieRouteContext) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền thay đổi kho phim.", 401);
  }
  try {
    const id = await readId(context);
    const movie = parseMovie(await request.json());

    if (movie.id !== id) {
      return apiProblem("Mã phim trên URL và nội dung không khớp.", 400);
    }

    return apiData(await movieRepository.save(movie));
  } catch (error) {
    return apiError(error, "Không thể lưu phim.");
  }
}

export async function DELETE(_: Request, context: MovieRouteContext) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền thay đổi kho phim.", 401);
  }
  try {
    const id = await readId(context);
    return (await movieRepository.remove(id))
      ? apiData(null)
      : apiProblem("Không tìm thấy phim.", 404);
  } catch (error) {
    return apiError(error, "Không thể xóa phim.");
  }
}
