import {
  defaultSettings,
  viewerSeed,
  type SiteSettings,
  type Viewer,
} from "@/lib/admin-data";
import { requestApi } from "@/lib/api-client";
import { apiMode } from "@/lib/config";
import { readStorage, storageKeys, writeStorage } from "@/lib/client-storage";

export const adminGateway = {
  async listViewers(): Promise<Viewer[]> {
    if (apiMode === "mock") {
      const viewers = readStorage<Viewer[]>(storageKeys.viewers, viewerSeed);
      if (!localStorage.getItem(storageKeys.viewers)) {
        writeStorage(storageKeys.viewers, viewers);
      }
      return viewers;
    }
    return requestApi<Viewer[]>("/users", { cache: "no-store" });
  },

  async saveViewer(viewer: Viewer): Promise<Viewer> {
    if (apiMode === "mock") {
      const viewers = readStorage<Viewer[]>(storageKeys.viewers, viewerSeed);
      const next = viewers.some((item) => item.id === viewer.id)
        ? viewers.map((item) => (item.id === viewer.id ? viewer : item))
        : [viewer, ...viewers];
      writeStorage(storageKeys.viewers, next);
      return viewer;
    }
    return requestApi<Viewer>(`/users/${viewer.id}`, {
      method: "PUT",
      body: JSON.stringify(viewer),
    });
  },

  async removeViewer(id: number): Promise<void> {
    if (apiMode === "mock") {
      writeStorage(
        storageKeys.viewers,
        readStorage<Viewer[]>(storageKeys.viewers, viewerSeed).filter(
          (viewer) => viewer.id !== id,
        ),
      );
      return;
    }
    await requestApi<null>(`/users/${id}`, { method: "DELETE" });
  },

  async getSettings(): Promise<SiteSettings> {
    if (apiMode === "mock") {
      return {
        ...defaultSettings,
        ...readStorage<SiteSettings>(storageKeys.settings, defaultSettings),
      };
    }
    return requestApi<SiteSettings>("/settings", { cache: "no-store" });
  },

  async saveSettings(settings: SiteSettings): Promise<SiteSettings> {
    if (apiMode === "mock") {
      writeStorage(storageKeys.settings, settings);
      return settings;
    }
    return requestApi<SiteSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },
};
