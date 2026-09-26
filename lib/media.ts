export const mediaCategories = [
  "video",
  "poster",
  "subtitle",
  "audio",
] as const;

export type MediaCategory = (typeof mediaCategories)[number];

export type MediaUploadRequest = {
  movieId: number;
  slug?: string;
  category: MediaCategory;
  filename: string;
  contentType: string;
  size: number;
};

export type PresignedUpload = {
  key: string;
  uploadUrl: string;
  readUrl: string;
  expiresAt: string;
  contentType: string;
};

export type MediaObject = {
  key: string;
  size: number;
  etag: string;
  uploadedAt: string;
  contentType?: string;
  readUrl: string;
};

export const mediaRules: Record<
  MediaCategory,
  { accept: string; maxBytes: number; contentTypes: readonly string[] }
> = {
  video: {
    accept: "video/mp4,video/webm,video/quicktime,video/x-matroska",
    maxBytes: 2 * 1024 * 1024 * 1024,
    contentTypes: [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-matroska",
    ],
  },
  poster: {
    accept: "image/jpeg,image/jpg,image/png,image/webp,image/avif,image/gif",
    maxBytes: 15 * 1024 * 1024,
    contentTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
    ],
  },
  subtitle: {
    accept: ".vtt,text/vtt",
    maxBytes: 5 * 1024 * 1024,
    contentTypes: ["text/vtt"],
  },
  audio: {
    accept: "audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav",
    maxBytes: 250 * 1024 * 1024,
    contentTypes: [
      "audio/mpeg",
      "audio/mp4",
      "audio/aac",
      "audio/ogg",
      "audio/wav",
      "audio/x-wav",
    ],
  },
};

export function inferContentType(filename: string, declared?: string): string {
  if (declared && declared !== "application/octet-stream" && declared !== "") {
    return declared.toLowerCase();
  }
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "mkv":
      return "video/x-matroska";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "vtt":
      return "text/vtt";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    default:
      return declared?.toLowerCase() || "application/octet-stream";
  }
}
