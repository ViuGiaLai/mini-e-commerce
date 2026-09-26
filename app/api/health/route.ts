import { NextResponse } from "next/server";
import { getBackendStatus } from "@/lib/server/backend-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const production = process.env.NEXT_PUBLIC_API_MODE === "production";
  const backend = production ? await getBackendStatus() : null;
  const ready = backend?.ready ?? true;

  return NextResponse.json(
    {
      status: ready ? "ok" : "degraded",
      service: "viufilm3d",
      apiMode: production ? "production" : "mock",
      database: production ? backend?.database : "mock",
      ready,
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
