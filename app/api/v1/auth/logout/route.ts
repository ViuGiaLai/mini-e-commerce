import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/server/admin-session";

export function POST() {
  const response = NextResponse.json({ data: null });
  response.cookies.set(ADMIN_COOKIE, "", {
    ...adminCookieOptions,
    maxAge: 0,
  });
  return response;
}
