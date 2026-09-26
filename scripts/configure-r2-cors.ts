import { loadEnvConfig } from "@next/env";
import {
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  S3Client,
  type CORSRule,
} from "@aws-sdk/client-s3";

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

const ruleId = "viufilm3d-browser-upload";
const applicationRule: CORSRule = {
  ID: ruleId,
  AllowedOrigins: [
    "http://localhost:3000",
    "https://mini-e-commerce-3l2u.onrender.com",
  ],
  AllowedMethods: ["GET", "PUT", "HEAD"],
  AllowedHeaders: ["Content-Type"],
  ExposeHeaders: ["ETag"],
  MaxAgeSeconds: 3600,
};

async function currentRules(): Promise<CORSRule[]> {
  try {
    const current = await client.send(
      new GetBucketCorsCommand({ Bucket: bucket }),
    );
    return current.CORSRules ?? [];
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (status === 404) return [];
    throw error;
  }
}

async function configure() {
  const existing = await currentRules();
  const rules = [
    ...existing.filter((rule) => rule.ID !== ruleId),
    applicationRule,
  ];
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: rules },
    }),
  );
  console.log(
    `Đã cấu hình CORS cho bucket '${bucket}' và giữ nguyên ${existing.filter((rule) => rule.ID !== ruleId).length} rule khác.`,
  );
}

configure().catch((error) => {
  console.error(
    "Không thể cấu hình R2 CORS:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
