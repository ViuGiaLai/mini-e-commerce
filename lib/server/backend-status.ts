import "server-only";
import { createSupabaseReadClient } from "@/lib/supabase/server";
import {
  isAdminAuthConfigured,
  isR2Configured,
  isSupabaseAdminConfigured,
  isSupabaseReadConfigured,
} from "@/lib/server/env";

export type ServiceState = "connected" | "not_configured" | "unavailable";

export type BackendStatus = {
  api: "ok";
  database: ServiceState;
  databaseAdmin: "configured" | "not_configured";
  adminAuth: "configured" | "not_configured";
  objectStorage: "configured" | "not_configured";
  ready: boolean;
};

export async function getBackendStatus(): Promise<BackendStatus> {
  let database: ServiceState = "not_configured";

  if (isSupabaseReadConfigured()) {
    try {
      // Do not use a HEAD request here. PostgREST can return 204 for HEAD even
      // when a table is absent from the schema cache, creating a false positive.
      const { error } = await createSupabaseReadClient()
        .from("movies")
        .select("id")
        .limit(1);
      database = error ? "unavailable" : "connected";
    } catch {
      database = "unavailable";
    }
  }

  const databaseAdmin = isSupabaseAdminConfigured()
    ? "configured"
    : "not_configured";
  const adminAuth = isAdminAuthConfigured() ? "configured" : "not_configured";
  const objectStorage = isR2Configured() ? "configured" : "not_configured";

  return {
    api: "ok",
    database,
    databaseAdmin,
    adminAuth,
    objectStorage,
    ready:
      database === "connected" &&
      databaseAdmin === "configured" &&
      adminAuth === "configured" &&
      objectStorage === "configured",
  };
}
