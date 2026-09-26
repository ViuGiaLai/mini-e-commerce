import { requestApi } from "@/lib/api-client";
import { apiMode } from "@/lib/config";
import type { MediaCategory, PresignedUpload } from "@/lib/media";

type CompletedUpload = {
  key: string;
  size: number;
  etag: string;
  contentType?: string;
  readUrl: string;
};

type ResolvedMedia = {
  key: string;
  url: string;
  expiresAt: string;
};

const resolvedCache = new Map<string, { url: string; expiresAt: number }>();

const isDirectUrl = (value: string) =>
  value.startsWith("/") ||
  value.startsWith("blob:") ||
  /^https?:\/\//i.test(value);

export const mediaGateway = {
  async upload(
    movieId: number,
    category: MediaCategory,
    file: File,
    slug?: string,
  ): Promise<CompletedUpload> {
    const cleanSlug = (slug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "");
    const folder = cleanSlug ? `${cleanSlug}-${movieId}` : `${movieId}`;

    if (apiMode === "mock") {
      const blobUrl = URL.createObjectURL(file);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const mockKey = `movies/${folder}/${category}/${safeName}`;
      resolvedCache.set(mockKey, {
        url: blobUrl,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
      return {
        key: mockKey,
        size: file.size,
        etag: "mock-etag",
        contentType: file.type || "application/octet-stream",
        readUrl: blobUrl,
      };
    }

    // 1. Try server proxy upload (avoids Cloudflare R2 browser CORS restrictions)
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("movieId", String(movieId));
      formData.append("category", category);
      if (cleanSlug) {
        formData.append("slug", cleanSlug);
      }

      const completed = await requestApi<CompletedUpload>("/media/upload", {
        method: "POST",
        body: formData,
      });

      resolvedCache.set(completed.key, {
        url: completed.readUrl,
        expiresAt: Date.now() + 55 * 60 * 1000,
      });
      return completed;
    } catch (proxyError) {
      // If unauthorized, do not fallback to presign as presign will also fail with 401
      if (
        proxyError instanceof Error &&
        (proxyError.message.includes("401") ||
          proxyError.message.includes("quyền"))
      ) {
        throw new Error(
          "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại tài khoản quản trị.",
        );
      }

      console.warn(
        "Direct upload failed, trying presign fallback:",
        proxyError,
      );

      // 2. Fallback to presigned upload URL
      const presigned = await requestApi<PresignedUpload>("/media/presign", {
        method: "POST",
        body: JSON.stringify({
          movieId,
          slug: cleanSlug || undefined,
          category,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        }),
      });

      const uploaded = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": presigned.contentType },
        body: file,
      });
      if (!uploaded.ok) {
        throw new Error(
          `Không thể tải tệp lên R2 (HTTP ${uploaded.status}). Hãy kiểm tra CORS hoặc dùng đường dẫn trực tiếp.`,
        );
      }

      const completed = await requestApi<CompletedUpload>("/media/complete", {
        method: "POST",
        body: JSON.stringify({ key: presigned.key }),
      });
      resolvedCache.set(completed.key, {
        url: completed.readUrl,
        expiresAt: Date.now() + 55 * 60 * 1000,
      });
      return completed;
    }
  },

  async resolve(value?: string): Promise<string | undefined> {
    if (!value || isDirectUrl(value)) return value;
    const cached = resolvedCache.get(value);
    if (cached && cached.expiresAt > Date.now()) return cached.url;

    if (apiMode === "mock") {
      return value;
    }

    const resolved = await requestApi<ResolvedMedia>(
      `/media/url?key=${encodeURIComponent(value)}`,
      { cache: "no-store" },
    );
    resolvedCache.set(value, {
      url: resolved.url,
      expiresAt: Date.parse(resolved.expiresAt) - 5 * 60 * 1000,
    });
    return resolved.url;
  },

  async remove(key: string) {
    if (isDirectUrl(key)) return;
    if (apiMode === "mock") {
      resolvedCache.delete(key);
      return;
    }

    await requestApi<null>("/media", {
      method: "DELETE",
      body: JSON.stringify({ key }),
    });
    resolvedCache.delete(key);
  },
};
