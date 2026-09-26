"use client";

import { mediaGateway } from "@/lib/media-gateway";

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((x) =>
      Math.max(0, Math.min(255, Math.round(x)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/**
 * Tự động trích xuất 2 màu chủ đạo từ hình ảnh poster:
 * - Màu 1 (Chính): Màu nền / tông màu chủ đạo tối hoặc trung tính của poster.
 * - Màu 2 (Phụ): Màu nhấn (accent/vibrant) có độ tương phản và bão hòa cao nhất.
 */
export async function extractDominantColors(
  source: string | File,
): Promise<[string, string]> {
  return new Promise((resolve) => {
    // Default fallback colors
    const fallbackColors: [string, string] = ["#0e1626", "#d97706"];

    if (typeof window === "undefined") {
      resolve(fallbackColors);
      return;
    }

    let urlToRevoke: string | undefined;
    let imageUrl = "";

    if (source instanceof File) {
      imageUrl = URL.createObjectURL(source);
      urlToRevoke = imageUrl;
    } else if (typeof source === "string" && source.trim()) {
      imageUrl = source.trim();
    } else {
      resolve(fallbackColors);
      return;
    }

    // Resolve R2 object keys if needed
    const prepareUrl = async () => {
      if (
        !imageUrl.startsWith("blob:") &&
        !imageUrl.startsWith("/") &&
        !imageUrl.startsWith("http")
      ) {
        const resolved = await mediaGateway
          .resolve(imageUrl)
          .catch(() => undefined);
        if (resolved) imageUrl = resolved;
      }
    };

    prepareUrl().then(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      const cleanup = () => {
        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      };

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            cleanup();
            resolve(fallbackColors);
            return;
          }

          // Sample at 48x48 for fast processing
          const width = 48;
          const height = 48;
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          let totalR = 0;
          let totalG = 0;
          let totalB = 0;
          let sampleCount = 0;

          // Track vibrant candidates for secondary color
          let maxVibrancy = -1;
          let vibrantColor = { r: 217, g: 119, b: 6 };

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a < 128) continue; // Skip transparent pixels

            totalR += r;
            totalG += g;
            totalB += b;
            sampleCount++;

            // Calculate saturation and brightness
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            const saturation = max === 0 ? 0 : delta / max;
            const brightness = (r + g + b) / 3;

            // Look for vibrant color (medium-high brightness and high saturation)
            const vibrancy =
              saturation * 1.5 + (brightness > 60 && brightness < 220 ? 1 : 0);
            if (vibrancy > maxVibrancy) {
              maxVibrancy = vibrancy;
              vibrantColor = { r, g, b };
            }
          }

          cleanup();

          if (sampleCount === 0) {
            resolve(fallbackColors);
            return;
          }

          // Primary color: darker tone of the average color (great for card background & hero glows)
          const avgR = totalR / sampleCount;
          const avgG = totalG / sampleCount;
          const avgB = totalB / sampleCount;

          // Normalize primary to dark/rich background tone
          const factor = Math.min(
            1,
            45 / Math.max(1, (avgR + avgG + avgB) / 3),
          );
          const primaryHex = rgbToHex(
            avgR * factor,
            avgG * factor,
            avgB * factor,
          );

          // Secondary color: vibrant accent from image
          const secondaryHex = rgbToHex(
            vibrantColor.r,
            vibrantColor.g,
            vibrantColor.b,
          );

          resolve([primaryHex, secondaryHex]);
        } catch {
          cleanup();
          resolve(fallbackColors);
        }
      };

      img.onerror = () => {
        cleanup();
        resolve(fallbackColors);
      };

      img.src = imageUrl;
    });
  });
}

/**
 * Tự động trích xuất thời lượng (duration) và chất lượng (quality) từ tệp hoặc URL video
 */
export async function extractVideoMetadata(
  source: string | File,
): Promise<{ duration: number; quality: "4K" | "Full HD" }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ duration: 24, quality: "Full HD" });
      return;
    }

    let urlToRevoke: string | undefined;
    let videoUrl = "";

    if (source instanceof File) {
      videoUrl = URL.createObjectURL(source);
      urlToRevoke = videoUrl;
    } else if (typeof source === "string" && source.trim()) {
      videoUrl = source.trim();
    } else {
      resolve({ duration: 24, quality: "Full HD" });
      return;
    }

    const prepareUrl = async () => {
      if (
        !videoUrl.startsWith("blob:") &&
        !videoUrl.startsWith("/") &&
        !videoUrl.startsWith("http")
      ) {
        const resolved = await mediaGateway
          .resolve(videoUrl)
          .catch(() => undefined);
        if (resolved) videoUrl = resolved;
      }
    };

    prepareUrl().then(() => {
      const video = document.createElement("video");
      video.preload = "metadata";

      const cleanup = () => {
        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
        video.src = "";
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve({ duration: 24, quality: "Full HD" });
      }, 7000); // 7s timeout fallback

      video.onloadedmetadata = () => {
        clearTimeout(timer);
        try {
          const rawDuration = video.duration;
          const durationInMinutes =
            Number.isFinite(rawDuration) && rawDuration > 0
              ? Math.max(1, Math.round(rawDuration / 60))
              : 24;

          const width = video.videoWidth || 0;
          const height = video.videoHeight || 0;
          const is4K = height >= 2160 || width >= 3840;

          cleanup();
          resolve({
            duration: durationInMinutes,
            quality: is4K ? "4K" : "Full HD",
          });
        } catch {
          cleanup();
          resolve({ duration: 24, quality: "Full HD" });
        }
      };

      video.onerror = () => {
        clearTimeout(timer);
        cleanup();
        // Resolve with fallback instead of hard error so UI does not block
        resolve({ duration: 24, quality: "Full HD" });
      };

      video.src = videoUrl;
    });
  });
}

/**
 * Tự động chụp 1 frame từ video làm hình ảnh thumbnail/poster
 */
export async function extractVideoThumbnail(
  source: string | File,
  timeInSeconds = 1.0,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(undefined);
      return;
    }

    let urlToRevoke: string | undefined;
    let videoUrl = "";

    if (source instanceof File) {
      videoUrl = URL.createObjectURL(source);
      urlToRevoke = videoUrl;
    } else if (typeof source === "string" && source.trim()) {
      videoUrl = source.trim();
    } else {
      resolve(undefined);
      return;
    }

    const prepareUrl = async () => {
      if (
        !videoUrl.startsWith("blob:") &&
        !videoUrl.startsWith("/") &&
        !videoUrl.startsWith("http")
      ) {
        const resolved = await mediaGateway
          .resolve(videoUrl)
          .catch(() => undefined);
        if (resolved) videoUrl = resolved;
      }
    };

    prepareUrl().then(() => {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      const cleanup = () => {
        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
        video.src = "";
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve(undefined);
      }, 8000);

      video.onloadeddata = () => {
        const targetTime = Math.min(
          timeInSeconds,
          video.duration > 2 ? 1.0 : video.duration / 2,
        );
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            cleanup();
            resolve(dataUrl);
            return;
          }
        } catch {
          // ignore
        }
        cleanup();
        resolve(undefined);
      };

      video.onerror = () => {
        clearTimeout(timer);
        cleanup();
        resolve(undefined);
      };

      video.src = videoUrl;
    });
  });
}
