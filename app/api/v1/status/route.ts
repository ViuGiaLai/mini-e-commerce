import { NextResponse } from "next/server";
import { getBackendStatus } from "@/lib/server/backend-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getBackendStatus();

  return NextResponse.json(
    { data: status },
    {
      status: status.ready ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
