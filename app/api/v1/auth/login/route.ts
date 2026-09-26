import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminToken,
} from "@/lib/server/admin-session";
import { apiError } from "@/lib/server/api-response";
import { getAdminCredentials } from "@/lib/server/env";

export async function POST(request: Request) {
  try {
    const { email: adminEmail, password: adminPassword } =
      getAdminCredentials();
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    const suppliedPassword = Buffer.from(password);
    const expectedPassword = Buffer.from(adminPassword);
    const passwordMatches =
      suppliedPassword.length === expectedPassword.length &&
      timingSafeEqual(suppliedPassword, expectedPassword);

    if (email !== adminEmail || !passwordMatches) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      data: { email, name: "Quản trị viên", role: "admin" },
    });
    response.cookies.set(
      ADMIN_COOKIE,
      createAdminToken(email),
      adminCookieOptions,
    );
    return response;
  } catch (error) {
    return apiError(error, "Yêu cầu đăng nhập không hợp lệ.");
  }
}
