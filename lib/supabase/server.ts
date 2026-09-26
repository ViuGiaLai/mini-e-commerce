import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv, getSupabaseReadEnv } from "@/lib/server/env";

export function createSupabaseReadClient() {
  const { url, publishableKey } = getSupabaseReadEnv();

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseAdminClient() {
  const { url, secretKey } = getSupabaseAdminEnv();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
