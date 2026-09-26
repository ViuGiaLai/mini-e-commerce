import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

loadEnvConfig(process.cwd());

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT;
const bucket = process.env.R2_BUCKET;

if (!accessKeyId || !secretAccessKey || !endpoint || !bucket) {
  throw new Error("Thiếu một hoặc nhiều biến môi trường R2.");
}

const client = new S3Client({
  region: "auto",
  endpoint,
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: { accessKeyId, secretAccessKey },
});

async function check() {
  const result = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }),
  );
  console.log(
    `Kết nối R2 thành công. Bucket '${bucket}' sẵn sàng, kiểm tra thấy ${result.KeyCount ?? 0} object.`,
  );

  const healthKey = `health/${randomUUID()}.txt`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: healthKey,
      Body: "ViuFilm3D R2 health check",
      ContentType: "text/plain",
    }),
  );
  const uploaded = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: healthKey }),
  );
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: healthKey }),
  );
  console.log(
    `Quyền ghi/đọc/xóa R2 hoạt động (${uploaded.ContentLength ?? 0} bytes); object kiểm tra đã được dọn dẹp.`,
  );

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: "health/cors-check.txt",
      ContentType: "text/plain",
    }),
    { expiresIn: 60 },
  );
  const origins = [
    "http://localhost:3000",
    "https://mini-e-commerce-3l2u.onrender.com",
  ];
  for (const origin of origins) {
    const response = await fetch(uploadUrl, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    const allowedOrigin = response.headers.get("access-control-allow-origin");
    console.log(
      allowedOrigin === origin || allowedOrigin === "*"
        ? `CORS hợp lệ cho ${origin}.`
        : `CORS chưa cho phép ${origin}; hãy áp dụng policy trong docs/R2.md.`,
    );
  }
}

check().catch((error) => {
  console.error(
    "Không thể kết nối R2:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
