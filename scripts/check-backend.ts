import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const authConfigured = Boolean(
  process.env.ADMIN_EMAIL?.trim() &&
  process.env.ADMIN_PASSWORD &&
  process.env.AUTH_SECRET &&
  process.env.AUTH_SECRET.length >= 32,
);
const r2Configured = Boolean(
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_ENDPOINT &&
  process.env.R2_BUCKET,
);

async function checkBackend() {
  let failed = false;

  const result = (label: string, ok: boolean, detail?: string) => {
    console.log(
      `${ok ? "OK" : "FAIL"}  ${label}${detail ? `: ${detail}` : ""}`,
    );
    failed ||= !ok;
  };

  result("Supabase read environment", Boolean(url && publishableKey));
  result("Supabase admin secret", Boolean(url && secretKey));
  result("Admin credentials and AUTH_SECRET", authConfigured);
  result("Cloudflare R2 environment", r2Configured);

  if (url && publishableKey) {
    const readClient = createClient(url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    for (const table of ["movies", "site_settings"] as const) {
      const { error } = await readClient.from(table).select("id").limit(1);
      result(
        `Table public.${table}`,
        !error,
        error ? `${error.code}: ${error.message}` : undefined,
      );
    }
  }

  if (url && secretKey) {
    const adminClient = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await adminClient.from("app_users").select("id").limit(1);
    result(
      "Table public.app_users with admin access",
      !error,
      error ? `${error.code}: ${error.message}` : undefined,
    );
  }

  if (failed) {
    console.error(
      "Backend production chưa sẵn sàng. Xem docs/BACKEND.md để hoàn tất cấu hình.",
    );
    process.exitCode = 1;
  } else {
    console.log("Backend production đã sẵn sàng.");
  }
}

void checkBackend();
