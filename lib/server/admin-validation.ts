import type { SiteSettings, Viewer } from "@/lib/admin-data";
import { ValidationError } from "@/lib/server/errors";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userStatuses: Viewer["status"][] = ["Đang hoạt động", "Đã khóa"];
const userPlans: Viewer["plan"][] = ["Miễn phí", "VIP"];

export function parseViewer(value: unknown): Viewer {
  if (!value || typeof value !== "object") {
    throw new ValidationError("Dữ liệu người dùng không hợp lệ.");
  }

  const viewer = value as Partial<Viewer>;
  if (!Number.isSafeInteger(viewer.id) || Number(viewer.id) <= 0) {
    throw new ValidationError("Mã người dùng không hợp lệ.");
  }
  if (!viewer.name?.trim() || viewer.name.trim().length > 100) {
    throw new ValidationError("Tên người dùng phải có từ 1 đến 100 ký tự.");
  }
  if (!viewer.email || !emailPattern.test(viewer.email)) {
    throw new ValidationError("Email người dùng không hợp lệ.");
  }
  if (!(["admin", "user"] as const).includes(viewer.role as Viewer["role"])) {
    throw new ValidationError("Vai trò người dùng không hợp lệ.");
  }
  if (!userStatuses.includes(viewer.status as Viewer["status"])) {
    throw new ValidationError("Trạng thái người dùng không hợp lệ.");
  }
  if (!userPlans.includes(viewer.plan as Viewer["plan"])) {
    throw new ValidationError("Gói người dùng không hợp lệ.");
  }
  if (
    !viewer.joinedAt ||
    Number.isNaN(Date.parse(viewer.joinedAt)) ||
    !viewer.lastActive ||
    Number.isNaN(Date.parse(viewer.lastActive))
  ) {
    throw new ValidationError("Thời gian người dùng không hợp lệ.");
  }
  if (!Number.isSafeInteger(viewer.watches) || Number(viewer.watches) < 0) {
    throw new ValidationError("Số lượt xem của người dùng không hợp lệ.");
  }

  return {
    ...(viewer as Viewer),
    name: viewer.name.trim(),
    email: viewer.email.trim().toLowerCase(),
  };
}

export function parseSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") {
    throw new ValidationError("Cấu hình hệ thống không hợp lệ.");
  }

  const settings = value as Partial<SiteSettings>;
  if (!settings.siteName?.trim() || settings.siteName.trim().length > 80) {
    throw new ValidationError("Tên website phải có từ 1 đến 80 ký tự.");
  }
  if (!settings.tagline?.trim() || settings.tagline.trim().length > 160) {
    throw new ValidationError("Khẩu hiệu phải có từ 1 đến 160 ký tự.");
  }
  if (!settings.supportEmail || !emailPattern.test(settings.supportEmail)) {
    throw new ValidationError("Email hỗ trợ không hợp lệ.");
  }
  if (
    typeof settings.maintenance !== "boolean" ||
    typeof settings.allowRegistration !== "boolean" ||
    typeof settings.showViewCount !== "boolean"
  ) {
    throw new ValidationError("Giá trị bật/tắt trong cấu hình không hợp lệ.");
  }
  if (
    !Number.isInteger(settings.itemsPerPage) ||
    Number(settings.itemsPerPage) < 8 ||
    Number(settings.itemsPerPage) > 100
  ) {
    throw new ValidationError("Số phim mỗi trang phải từ 8 đến 100.");
  }

  return {
    ...(settings as SiteSettings),
    siteName: settings.siteName.trim(),
    tagline: settings.tagline.trim(),
    supportEmail: settings.supportEmail.trim().toLowerCase(),
  };
}
