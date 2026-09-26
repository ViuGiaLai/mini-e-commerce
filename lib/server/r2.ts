import "server-only";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Env } from "@/lib/server/env";
import { DatabaseError, ValidationError } from "@/lib/server/errors";
import {
  mediaCategories,
  mediaRules,
  type MediaCategory,
  type MediaObject,
  type MediaUploadRequest,
  type PresignedUpload,
} from "@/lib/media";

const UPLOAD_URL_TTL_SECONDS = 15 * 60;
const READ_URL_TTL_SECONDS = 60 * 60;

let cachedClient: S3Client | undefined;

const client = () => {
  if (cachedClient) return cachedClient;
  const env = getR2Env();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: env.endpoint,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
  return cachedClient;
};

const safeFilename = (filename: string) => {
  const normalized = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120);
  return normalized || "media.bin";
};

export const assertMediaKey = (value: unknown) => {
  const key = String(value ?? "").trim();
  if (
    !key ||
    key.length > 1024 ||
    key.includes("..") ||
    key.startsWith("/") ||
    !key.startsWith("movies/")
  ) {
    throw new ValidationError("Đường dẫn tệp R2 không hợp lệ.");
  }
  return key;
};

export function getMovieMediaFolder(
  movieId: number,
  slug?: string,
  filename?: string,
): string {
  let cleanSlug = (slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");

  if (!cleanSlug && filename) {
    cleanSlug = filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
  }

  return cleanSlug ? `${cleanSlug}-${movieId}` : `${movieId}`;
}

export function parseUploadRequest(value: unknown): MediaUploadRequest {
  if (!value || typeof value !== "object") {
    throw new ValidationError("Thông tin tệp tải lên không hợp lệ.");
  }
  const request = value as Partial<MediaUploadRequest>;
  if (!Number.isSafeInteger(request.movieId) || Number(request.movieId) <= 0) {
    throw new ValidationError("Mã phim không hợp lệ.");
  }
  if (!mediaCategories.includes(request.category as MediaCategory)) {
    throw new ValidationError("Loại nội dung media không hợp lệ.");
  }
  if (!request.filename?.trim() || request.filename.length > 255) {
    throw new ValidationError("Tên tệp không hợp lệ.");
  }

  const category = request.category as MediaCategory;
  const contentType = String(request.contentType ?? "").toLowerCase();
  const rule = mediaRules[category];
  if (!rule.contentTypes.includes(contentType)) {
    throw new ValidationError(`Định dạng ${category} không được hỗ trợ.`);
  }
  if (
    !Number.isSafeInteger(request.size) ||
    Number(request.size) <= 0 ||
    Number(request.size) > rule.maxBytes
  ) {
    throw new ValidationError(`Dung lượng ${category} vượt giới hạn cho phép.`);
  }

  const slug =
    typeof request.slug === "string" ? request.slug.trim() : undefined;

  return {
    movieId: Number(request.movieId),
    slug,
    category,
    filename: request.filename.trim(),
    contentType,
    size: Number(request.size),
  };
}

const signedReadUrl = async (key: string) => {
  const { bucket } = getR2Env();
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: READ_URL_TTL_SECONDS },
  );
};

const handleR2Error = (error: unknown): never => {
  const details = error instanceof Error ? error.message : String(error);
  throw new DatabaseError(
    "Không thể thực hiện thao tác với Cloudflare R2.",
    details,
  );
};

export const r2Media = {
  async uploadDirect(
    movieId: number,
    category: MediaCategory,
    filename: string,
    fileBuffer: Buffer | Uint8Array,
    contentType: string,
    slug?: string,
  ): Promise<MediaObject> {
    const { bucket } = getR2Env();
    const folder = getMovieMediaFolder(movieId, slug, filename);
    const key = `movies/${folder}/${category}/${randomUUID()}-${safeFilename(filename)}`;
    try {
      const result = await client().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        }),
      );
      return {
        key,
        size: fileBuffer.length,
        etag: (result.ETag ?? "").replace(/"/g, ""),
        uploadedAt: new Date().toISOString(),
        contentType,
        readUrl: await signedReadUrl(key),
      };
    } catch (error) {
      return handleR2Error(error);
    }
  },

  async createUpload(request: MediaUploadRequest): Promise<PresignedUpload> {
    const { bucket } = getR2Env();
    const folder = getMovieMediaFolder(
      request.movieId,
      request.slug,
      request.filename,
    );
    const key = `movies/${folder}/${request.category}/${randomUUID()}-${safeFilename(request.filename)}`;
    try {
      const uploadUrl = await getSignedUrl(
        client(),
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: request.contentType,
        }),
        { expiresIn: UPLOAD_URL_TTL_SECONDS },
      );
      return {
        key,
        uploadUrl,
        readUrl: await signedReadUrl(key),
        expiresAt: new Date(
          Date.now() + UPLOAD_URL_TTL_SECONDS * 1000,
        ).toISOString(),
        contentType: request.contentType,
      };
    } catch (error) {
      return handleR2Error(error);
    }
  },

  async resolve(key: string) {
    try {
      return await signedReadUrl(assertMediaKey(key));
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      return handleR2Error(error);
    }
  },

  async verify(key: string) {
    const { bucket } = getR2Env();
    try {
      const object = await client().send(
        new HeadObjectCommand({ Bucket: bucket, Key: assertMediaKey(key) }),
      );
      return {
        size: Number(object.ContentLength ?? 0),
        etag: object.ETag ?? "",
        contentType: object.ContentType,
      };
    } catch (error) {
      return handleR2Error(error);
    }
  },

  async list(prefix = "movies/", cursor?: string) {
    const { bucket } = getR2Env();
    try {
      const result = await client().send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: cursor,
          MaxKeys: 100,
        }),
      );
      const objects = await Promise.all(
        (result.Contents ?? []).map(async (object): Promise<MediaObject> => ({
          key: object.Key ?? "",
          size: Number(object.Size ?? 0),
          etag: object.ETag ?? "",
          uploadedAt: object.LastModified?.toISOString() ?? "",
          readUrl: await signedReadUrl(object.Key ?? ""),
        })),
      );
      return {
        objects,
        cursor: result.NextContinuationToken,
        truncated: Boolean(result.IsTruncated),
      };
    } catch (error) {
      return handleR2Error(error);
    }
  },

  async remove(key: string) {
    const { bucket } = getR2Env();
    try {
      await client().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: assertMediaKey(key) }),
      );
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      handleR2Error(error);
    }
  },
};
