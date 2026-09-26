import { requestApi } from "@/lib/api-client";
import { apiMode } from "@/lib/config";
import type { Account } from "@/lib/app-types";

export const authGateway = {
  async login(email: string, password: string): Promise<Account | null> {
    if (apiMode === "mock") return null;
    return requestApi<Account | null>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async session(): Promise<Account | null> {
    if (apiMode === "mock") return null;
    return requestApi<Account | null>("/auth/session", {
      cache: "no-store",
    });
  },

  async logout() {
    if (apiMode !== "production") return;
    await requestApi<null>("/auth/logout", { method: "POST" }).catch(
      () => undefined,
    );
  },
};
