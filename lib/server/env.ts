import "server-only";
import { ConfigurationError } from "@/lib/server/errors";

const supabaseUrl = () =>
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

export const isSupabaseReadConfigured = () =>
  Boolean(supabaseUrl() && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const isSupabaseAdminConfigured = () =>
  Boolean(supabaseUrl() && process.env.SUPABASE_SECRET_KEY);

export const isAdminAuthConfigured = () =>
  Boolean(
    process.env.ADMIN_EMAIL?.trim() &&
    process.env.ADMIN_PASSWORD &&
    process.env.AUTH_SECRET &&
    process.env.AUTH_SECRET.length >= 32,
  );

export function getSupabaseReadEnv() {
  const url = supabaseUrl();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new ConfigurationError(
      "Backend chưa được cấu hình kết nối đọc Supabase.",
    );
  }
  return { url, publishableKey };
}

export function getSupabaseAdminEnv() {
  const { url } = getSupabaseReadEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new ConfigurationError(
      "Backend chưa có SUPABASE_SECRET_KEY để thực hiện thao tác quản trị.",
    );
  }
  return { url, secretKey };
}

export function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new ConfigurationError(
      "Backend chưa cấu hình ADMIN_EMAIL và ADMIN_PASSWORD.",
    );
  }
  return { email, password };
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new ConfigurationError("AUTH_SECRET phải có ít nhất 32 ký tự.");
  }
  return secret;
}

export function getR2Env() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucket) {
    throw new ConfigurationError(
      "Backend chưa cấu hình đủ R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT và R2_BUCKET.",
    );
  }

  let normalizedEndpoint: string;
  try {
    normalizedEndpoint = new URL(endpoint).origin;
  } catch {
    throw new ConfigurationError("R2_ENDPOINT không phải URL hợp lệ.");
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint: normalizedEndpoint,
    bucket,
  };
}

export const isR2Configured = () =>
  Boolean(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT &&
    process.env.R2_BUCKET,
  );
