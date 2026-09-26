import { hasAdminSession } from "@/lib/server/admin-session";
import { adminRepository } from "@/lib/server/admin-repository";
import { parseViewer } from "@/lib/server/admin-validation";
import { apiData, apiError, apiProblem } from "@/lib/server/api-response";
import { ValidationError } from "@/lib/server/errors";

type UserRouteContext = { params: Promise<{ id: string }> };

const readId = async (context: UserRouteContext) => {
  const { id } = await context.params;
  const parsed = Number(id);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ValidationError("Mã người dùng không hợp lệ.");
  }
  return parsed;
};

export async function PUT(request: Request, context: UserRouteContext) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền thay đổi người dùng.", 401);
  }

  try {
    const id = await readId(context);
    const viewer = parseViewer(await request.json());
    if (viewer.id !== id) {
      return apiProblem("Mã người dùng trên URL và nội dung không khớp.", 400);
    }
    if (id === 1) {
      viewer.email = "admin@gmail.com";
      viewer.role = "admin";
      viewer.status = "Đang hoạt động";
    }

    return apiData(await adminRepository.saveUser(viewer));
  } catch (error) {
    return apiError(error, "Không thể lưu người dùng.");
  }
}

export async function DELETE(_: Request, context: UserRouteContext) {
  if (!(await hasAdminSession())) {
    return apiProblem("Bạn không có quyền xóa người dùng.", 401);
  }

  try {
    const id = await readId(context);
    if (id === 1) {
      return apiProblem("Không thể xóa tài khoản quản trị chính.", 409);
    }
    return (await adminRepository.removeUser(id))
      ? apiData(null)
      : apiProblem(
          "Không tìm thấy người dùng hoặc đây là tài khoản quản trị.",
          404,
        );
  } catch (error) {
    return apiError(error, "Không thể xóa người dùng.");
  }
}
