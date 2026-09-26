"use client";

import { useEffect, useId, useState } from "react";
import {
  Check,
  ExternalLink,
  Link as LinkIcon,
  LoaderCircle,
  UploadCloud,
  X,
} from "lucide-react";
import { mediaGateway } from "@/lib/media-gateway";
import { mediaRules, type MediaCategory } from "@/lib/media";

type MediaUploaderProps = {
  movieId: number;
  movieSlug?: string;
  category: MediaCategory;
  label: string;
  value?: string;
  onChange: (key: string) => void;
  onFileSelect?: (file: File) => void;
  infoBadge?: string;
};

const formatSize = (bytes: number) => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
};

export default function MediaUploader({
  movieId,
  movieSlug,
  category,
  label,
  value,
  onChange,
  onFileSelect,
  infoBadge,
}: MediaUploaderProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [readUrl, setReadUrl] = useState<string>();
  const [localPreview, setLocalPreview] = useState<string>();
  const [error, setError] = useState("");
  const [showDirectInput, setShowDirectInput] = useState(false);
  const rule = mediaRules[category];

  useEffect(() => {
    if (category !== "poster") return;
    if (!value) {
      setLocalPreview(undefined);
      return;
    }
    if (
      value.startsWith("/") ||
      value.startsWith("http") ||
      value.startsWith("blob:")
    ) {
      setLocalPreview(value);
      return;
    }
    let active = true;
    mediaGateway
      .resolve(value)
      .then((resolved) => {
        if (active && resolved) setLocalPreview(resolved);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value, category]);

  const upload = async (file?: File) => {
    if (!file) return;
    setError("");

    if (category === "poster") {
      setLocalPreview(URL.createObjectURL(file));
    }

    // Trigger instant client-side metadata extraction (e.g. video duration/resolution, poster colors)
    if (onFileSelect) {
      onFileSelect(file);
    }

    setUploading(true);
    try {
      const fileSlug = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase()
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      const effectiveSlug = movieSlug || fileSlug;

      const result = await mediaGateway.upload(
        movieId,
        category,
        file,
        effectiveSlug,
      );
      onChange(result.key);
      setReadUrl(result.readUrl);
      if (category === "poster") {
        setLocalPreview(result.readUrl);
      }
    } catch (uploadError) {
      const rawMsg =
        uploadError instanceof Error
          ? uploadError.message
          : String(uploadError);
      if (
        rawMsg.includes("Failed to fetch") ||
        rawMsg.includes("NetworkError") ||
        rawMsg.includes("CORS")
      ) {
        setError(
          "Không thể kết nối tải lên R2 (Lỗi CORS hoặc chưa thiết lập bucket R2). Bạn có thể nhập link/đường dẫn nội bộ trực tiếp.",
        );
      } else {
        setError(rawMsg || "Không thể tải tệp lên R2.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="media-uploader">
      <div className="media-upload-heading">
        <span>
          <b>{label}</b>
          <small>Tối đa {formatSize(rule.maxBytes)}</small>
        </span>
        {value && <Check aria-label="Đã có tệp" />}
      </div>
      <input
        id={inputId}
        type="file"
        accept={rule.accept}
        disabled={uploading}
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      <div className="media-upload-actions">
        <label htmlFor={inputId} className="secondary-btn">
          {uploading ? <LoaderCircle className="spin" /> : <UploadCloud />}
          {uploading ? "Đang tải lên R2…" : value ? "Thay tệp" : "Chọn tệp"}
        </label>
        <button
          type="button"
          className={`icon-action ${showDirectInput ? "active" : ""}`}
          title="Nhập trực tiếp URL hoặc Object Key"
          onClick={() => setShowDirectInput(!showDirectInput)}
        >
          <LinkIcon />
        </button>
        {(readUrl || value?.startsWith("http") || value?.startsWith("/")) && (
          <a
            className="icon-action"
            href={readUrl || value}
            target="_blank"
            rel="noreferrer"
            title="Mở tệp"
          >
            <ExternalLink />
          </a>
        )}
        {value && (
          <button
            className="icon-action danger"
            type="button"
            title="Bỏ liên kết khỏi phim"
            onClick={() => {
              onChange("");
              setReadUrl(undefined);
            }}
          >
            <X />
          </button>
        )}
      </div>

      {category === "poster" && localPreview && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 10,
            marginBottom: 10,
            padding: 8,
            borderRadius: 10,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--line)",
          }}
        >
          <img
            src={localPreview}
            alt="Poster Preview"
            style={{
              width: 54,
              height: 76,
              objectFit: "cover",
              borderRadius: 6,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          />
          <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
            <span
              style={{
                fontWeight: 600,
                display: "block",
                color: "#38bdf8",
              }}
            >
              🖼️ Ảnh xem trước Poster
            </span>
            <small
              style={{
                color: uploading
                  ? "#f59e0b"
                  : value
                    ? "#10b981"
                    : "var(--muted)",
                display: "block",
                marginTop: 2,
              }}
            >
              {uploading
                ? "⏳ Đang tải ảnh lên Cloudflare R2…"
                : value
                  ? "✓ Đã tải và lưu poster vào hệ thống"
                  : "Đã chọn ảnh (chờ lưu phim)"}
            </small>
          </div>
        </div>
      )}

      {infoBadge && <div className="media-auto-badge">{infoBadge}</div>}

      {showDirectInput ? (
        <div style={{ marginTop: 8 }}>
          <input
            style={{
              width: "100%",
              padding: "6px 10px",
              fontSize: 12,
              borderRadius: 6,
              background: "rgba(0,0,0,0.25)",
              border: "1px solid var(--line)",
              color: "inherit",
            }}
            placeholder={
              category === "video"
                ? "Dán URL video hoặc R2 key (VD: /videos/...)"
                : "Dán URL ảnh hoặc R2 key"
            }
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : (
        value && <code title={value}>{value}</code>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
