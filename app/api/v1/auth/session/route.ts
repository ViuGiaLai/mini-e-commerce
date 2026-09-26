import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/admin-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    data: {
      email: session.email,
      name: "Quản trị viên",
      role: session.role,
    },
  });
}
