import type { SiteSettings, Viewer } from "@/lib/admin-data";
import {
  createSupabaseAdminClient,
  createSupabaseReadClient,
} from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/server/errors";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: Viewer["role"];
  status: Viewer["status"];
  plan: Viewer["plan"];
  joined_at: string;
  last_active: string;
  watches: number;
};

type SettingsRow = {
  site_name: string;
  tagline: string;
  support_email: string;
  maintenance: boolean;
  allow_registration: boolean;
  show_view_count: boolean;
  items_per_page: number;
};

const fromUserRow = (row: UserRow): Viewer => ({
  id: Number(row.id),
  name: row.name,
  email: row.email,
  role: row.role,
  status: row.status,
  plan: row.plan,
  joinedAt: row.joined_at,
  lastActive: row.last_active,
  watches: Number(row.watches),
});

const toUserRow = (viewer: Viewer): UserRow => ({
  id: viewer.id,
  name: viewer.name,
  email: viewer.email.toLowerCase(),
  role: viewer.role,
  status: viewer.status,
  plan: viewer.plan,
  joined_at: viewer.joinedAt,
  last_active: viewer.lastActive,
  watches: viewer.watches,
});

const fromSettingsRow = (row: SettingsRow): SiteSettings => ({
  siteName: row.site_name,
  tagline: row.tagline,
  supportEmail: row.support_email,
  maintenance: row.maintenance,
  allowRegistration: row.allow_registration,
  showViewCount: row.show_view_count,
  itemsPerPage: row.items_per_page,
});

const toSettingsRow = (settings: SiteSettings) => ({
  id: 1,
  site_name: settings.siteName,
  tagline: settings.tagline,
  support_email: settings.supportEmail.toLowerCase(),
  maintenance: settings.maintenance,
  allow_registration: settings.allowRegistration,
  show_view_count: settings.showViewCount,
  items_per_page: settings.itemsPerPage,
});

const fail = (message: string): never => {
  throw new DatabaseError("Không thể truy cập dữ liệu quản trị.", message);
};

export const adminRepository = {
  async listUsers(): Promise<Viewer[]> {
    const { data, error } = await createSupabaseAdminClient()
      .from("app_users")
      .select("*")
      .order("id", { ascending: true });

    if (error) fail(error.message);
    return ((data ?? []) as UserRow[]).map(fromUserRow);
  },

  async saveUser(viewer: Viewer): Promise<Viewer> {
    const { data, error } = await createSupabaseAdminClient()
      .from("app_users")
      .upsert(toUserRow(viewer), { onConflict: "id" })
      .select("*")
      .single();

    if (error) fail(error.message);
    return fromUserRow(data as UserRow);
  },

  async removeUser(id: number): Promise<boolean> {
    const { data, error } = await createSupabaseAdminClient()
      .from("app_users")
      .delete()
      .eq("id", id)
      .neq("role", "admin")
      .select("id");

    if (error) fail(error.message);
    return Boolean(data?.length);
  },

  async getSettings(): Promise<SiteSettings | null> {
    const { data, error } = await createSupabaseReadClient()
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) fail(error.message);
    return data ? fromSettingsRow(data as SettingsRow) : null;
  },

  async saveSettings(settings: SiteSettings): Promise<SiteSettings> {
    const { data, error } = await createSupabaseAdminClient()
      .from("site_settings")
      .upsert(toSettingsRow(settings), { onConflict: "id" })
      .select("*")
      .single();

    if (error) fail(error.message);
    return fromSettingsRow(data as SettingsRow);
  },
};
