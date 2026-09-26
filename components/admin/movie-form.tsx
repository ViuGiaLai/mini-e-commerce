"use client";

import { useRef, useState } from "react";
import { Check, Film, Plus, Save, Sparkles, Trash2, Tv, X } from "lucide-react";
import { toSlug } from "@/lib/format";
import { genres, movieSeed, type EpisodeItem, type Movie } from "@/lib/movies";
import MediaUploader from "@/components/admin/media-uploader";
import { mediaGateway } from "@/lib/media-gateway";
import {
  extractDominantColors,
  extractVideoMetadata,
  extractVideoThumbnail,
} from "@/lib/media-extractor";

type MovieFormProps = {
  movie: Movie | null;
  close: () => void;
  save: (movie: Movie) => Promise<void>;
};

export default function MovieForm({ movie, close, save }: MovieFormProps) {
  const [form, setForm] = useState<Movie>(
    movie || {
      ...movieSeed[0],
      id: Date.now(),
      slug: "",
      title: "",
      originalTitle: "",
      episode: 1,
      totalEpisodes: 1,
      views: 0,
      rating: 8.5,
      featured: false,
      video: "/videos/viufilm3d-demo.mp4",
      colors: ["#0f172a", "#f59e0b"],
      duration: 90,
    },
  );

  // Phân loại định dạng: Phim lẻ (1 tập full) vs Phim bộ (nhiều tập)
  const [movieType, setMovieType] = useState<"single" | "series">(
    movie ? (movie.totalEpisodes <= 1 ? "single" : "series") : "series",
  );

  // Khởi tạo danh sách các tập phim cho phim bộ
  const [episodes, setEpisodes] = useState<EpisodeItem[]>(() => {
    if (movie?.episodes && movie.episodes.length > 0) {
      return [...movie.episodes].sort((a, b) => a.episode - b.episode);
    }
    const currentCount = Math.max(1, movie ? movie.episode : 1);
    const initialList: EpisodeItem[] = [];
    for (let i = 1; i <= currentCount; i++) {
      initialList.push({
        episode: i,
        video: i === 1 ? movie?.video || "" : "",
        title: `Tập ${i}`,
      });
    }
    return initialList;
  });

  const [selectedEpTab, setSelectedEpTab] = useState<number>(1);
  const [bulkUploading, setBulkUploading] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<string>("");
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const [videoBadge, setVideoBadge] = useState<string>("");
  const [posterBadge, setPosterBadge] = useState<string>("");
  const [error, setError] = useState("");

  // Tự động cập nhật thông báo khi có poster thay đổi
  const handlePosterChange = async (posterSource: string | File) => {
    try {
      const colors = await extractDominantColors(posterSource);
      setForm((prev) => ({ ...prev, colors }));
      setPosterBadge("✨ Đã tải lên ảnh poster");
    } catch {
      // Keep existing colors
    }
  };

  // Tự động trích xuất thời lượng & độ phân giải từ video, và tạo thumbnail frame nếu thiếu poster
  const handleVideoChange = async (videoSource: string | File) => {
    try {
      const meta = await extractVideoMetadata(videoSource);
      setForm((prev) => ({
        ...prev,
        duration: meta.duration,
        quality: meta.quality,
      }));
      setVideoBadge(`✨ Nhận diện: ${meta.duration} phút (${meta.quality})`);

      if (!form.poster) {
        const thumb = await extractVideoThumbnail(videoSource);
        if (thumb) {
          setForm((prev) => (prev.poster ? prev : { ...prev, poster: thumb }));
          setPosterBadge("✨ Đã tự động tạo ảnh poster từ video");
        }
      }
    } catch {
      // Keep existing duration/quality
    }
  };

  // Đồng bộ số tập khi người dùng thay đổi "Tập hiện tại"
  const handleEpisodeCountChange = (newCount: number) => {
    const validCount = Math.max(1, newCount);
    setForm((prev) => ({
      ...prev,
      episode: validCount,
      totalEpisodes: Math.max(prev.totalEpisodes, validCount),
    }));
    setEpisodes((prev) => {
      const next = [...prev];
      for (let i = 1; i <= validCount; i++) {
        if (!next.some((item) => item.episode === i)) {
          next.push({ episode: i, video: "", title: `Tập ${i}` });
        }
      }
      return next.sort((a, b) => a.episode - b.episode);
    });
    setSelectedEpTab(validCount);
  };

  const handleAddEpisode = () => {
    const nextEpNum = (episodes[episodes.length - 1]?.episode ?? 0) + 1;
    const nextList = [
      ...episodes,
      { episode: nextEpNum, video: "", title: `Tập ${nextEpNum}` },
    ];
    setEpisodes(nextList);
    setSelectedEpTab(nextEpNum);
    setForm((prev) => ({
      ...prev,
      episode: Math.max(prev.episode, nextEpNum),
      totalEpisodes: Math.max(prev.totalEpisodes, nextEpNum),
    }));
  };

  const handleRemoveEpisode = (epNum: number) => {
    if (episodes.length <= 1) return;
    if (!confirm(`Xóa cấu hình Tập ${epNum}?`)) return;
    const nextList = episodes.filter((item) => item.episode !== epNum);
    setEpisodes(nextList);
    if (selectedEpTab === epNum) {
      setSelectedEpTab(nextList[0]?.episode ?? 1);
    }
  };

  const handleEpisodeTitleChange = (epNum: number, title: string) => {
    setEpisodes((prev) =>
      prev.map((item) => (item.episode === epNum ? { ...item, title } : item)),
    );
    const match = title.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      const endEp = parseInt(match[2], 10);
      if (endEp > 0) {
        setForm((prev) => ({
          ...prev,
          episode: Math.max(prev.episode, endEp),
          totalEpisodes: Math.max(prev.totalEpisodes, endEp),
        }));
      }
    }
  };

  const handleEpisodeVideoChange = (epNum: number, videoKey: string) => {
    setEpisodes((prev) => {
      const next = prev.map((item) =>
        item.episode === epNum ? { ...item, video: videoKey } : item,
      );
      if (!next.some((item) => item.episode === epNum)) {
        next.push({ episode: epNum, video: videoKey, title: `Tập ${epNum}` });
      }
      return next.sort((a, b) => a.episode - b.episode);
    });
    if (epNum === 1 || !form.video) {
      setForm((prev) => ({ ...prev, video: videoKey }));
    }
  };

  const handleBulkUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    files.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    setBulkUploading(true);
    setBulkProgress(`Đang chuẩn bị tải ${files.length} tập...`);

    try {
      const currentHighestEp =
        episodes.length > 0 ? Math.max(...episodes.map((e) => e.episode)) : 0;
      const firstEmptyIndex = episodes.findIndex((e) => !e.video);
      const startEp =
        firstEmptyIndex !== -1
          ? episodes[firstEmptyIndex].episode
          : currentHighestEp + 1;

      const updatedEpisodes = [...episodes];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const targetEp = startEp + i;
        setBulkProgress(
          `Đang tải Tập ${targetEp} (${i + 1}/${files.length}): ${file.name}...`,
        );

        const currentSlug = form.slug || toSlug(form.title) || "";
        const result = await mediaGateway.upload(
          form.id,
          "video",
          file,
          currentSlug,
        );
        const existingIdx = updatedEpisodes.findIndex(
          (e) => e.episode === targetEp,
        );
        if (existingIdx !== -1) {
          updatedEpisodes[existingIdx] = {
            ...updatedEpisodes[existingIdx],
            video: result.key,
          };
        } else {
          updatedEpisodes.push({
            episode: targetEp,
            video: result.key,
            title: `Tập ${targetEp}`,
          });
        }
      }

      updatedEpisodes.sort((a, b) => a.episode - b.episode);
      setEpisodes(updatedEpisodes);
      const maxEp = Math.max(
        ...updatedEpisodes.map((e) => e.episode),
        form.episode,
      );
      setForm((prev) => ({
        ...prev,
        episode: maxEp,
        totalEpisodes: Math.max(prev.totalEpisodes, maxEp),
        video:
          updatedEpisodes.find((e) => e.episode === 1)?.video || prev.video,
      }));
      setSelectedEpTab(startEp + files.length - 1);
      setBulkProgress(`✨ Đã tải lên thành công ${files.length} tập!`);
      setTimeout(() => setBulkProgress(""), 4000);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Không thể tải các tập phim lên",
      );
    } finally {
      setBulkUploading(false);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const isSingle = movieType === "single";
    const finalEpisode = isSingle ? 1 : Number(form.episode);
    const finalTotalEpisodes = isSingle ? 1 : Number(form.totalEpisodes);

    if (!isSingle && finalEpisode > finalTotalEpisodes) {
      setError("Tập hiện tại không thể lớn hơn tổng số tập.");
      return;
    }
    if (!form.genres.length) {
      setError("Hãy chọn ít nhất một thể loại.");
      return;
    }

    if (!form.poster) {
      const confirmNoPoster = confirm(
        "⚠️ Phim này chưa có tệp ảnh Poster thực tế.\n\nBạn có muốn lưu phim mà không có ảnh poster không?\n(Hệ thống sẽ lấy thumbnail khung hình từ video nếu có)",
      );
      if (!confirmNoPoster) {
        return;
      }
    }

    const finalEpisodes = isSingle
      ? undefined
      : episodes.map((ep) => ({
          episode: ep.episode,
          video: ep.video.trim(),
          title: ep.title?.trim() || `Tập ${ep.episode}`,
        }));
    const primaryVideo =
      (isSingle
        ? form.video
        : episodes.find((e) => e.episode === 1)?.video ||
          episodes[0]?.video ||
          form.video) || "";

    if (form.status !== "Sắp chiếu" && !primaryVideo) {
      setError(
        "Vui lòng tải lên video cho phim (hoặc chọn trạng thái 'Sắp chiếu' nếu phim chưa phát hành).",
      );
      return;
    }

    void save({
      ...form,
      episode: finalEpisode,
      totalEpisodes: finalTotalEpisodes,
      video: primaryVideo,
      episodes: finalEpisodes,
      updateDay: isSingle ? "Trọn bộ" : form.updateDay,
      slug: form.slug.trim() || toSlug(form.title),
      title: form.title.trim(),
      originalTitle: form.originalTitle.trim(),
      description: form.description.trim(),
    });
  };

  const toggleGenre = (genre: string) => {
    setForm({
      ...form,
      genres: form.genres.includes(genre)
        ? form.genres.filter((item) => item !== genre)
        : [...form.genres, genre],
    });
  };

  return (
    <div className="modal-layer">
      <form className="movie-form movie-form-wide" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          <X />
        </button>
        <p className="mini-label">THƯ VIỆN NỘI BỘ</p>
        <h2>{movie ? "Chỉnh sửa phim" : "Thêm phim mới"}</h2>
        {error && <p className="form-error">{error}</p>}

        {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
        <div className="form-section-title">
          <b>Thông tin cơ bản</b>
          <span>Tên, đường dẫn và đơn vị sản xuất</span>
        </div>
        <div className="form-two">
          <label>
            Tên phim
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                  slug: movie ? form.slug : toSlug(event.target.value),
                })
              }
            />
          </label>
          <label>
            Tên quốc tế
            <input
              required
              value={form.originalTitle}
              onChange={(event) =>
                setForm({ ...form, originalTitle: event.target.value })
              }
            />
          </label>
        </div>
        <label>
          Đường dẫn phim
          <input
            required
            pattern="[a-z0-9-]+"
            value={form.slug}
            onChange={(event) =>
              setForm({ ...form, slug: toSlug(event.target.value) })
            }
          />
          <small className="input-help">
            /phim/{form.slug || "duong-dan-phim"}
          </small>
        </label>
        <div className="form-two">
          <label>
            Studio
            <input
              required
              value={form.studio}
              onChange={(event) =>
                setForm({ ...form, studio: event.target.value })
              }
            />
          </label>
          <label>
            Đạo diễn
            <input
              required
              value={form.director}
              onChange={(event) =>
                setForm({ ...form, director: event.target.value })
              }
            />
          </label>
        </div>

        {/* PHẦN 2: ĐỊNH DẠNG & PHÁT HÀNH */}
        <div className="form-section-title">
          <b>Định dạng và phát hành</b>
          <span>Phân biệt phim lẻ bản Full và phim bộ nhiều tập</span>
        </div>

        {/* BỘ CHỌN ĐỊNH DẠNG: PHIM BỘ VS PHIM LẺ */}
        <div className="movie-type-selector">
          <button
            type="button"
            className={`type-btn ${movieType === "series" ? "active" : ""}`}
            onClick={() => {
              setMovieType("series");
              setForm((prev) => ({
                ...prev,
                totalEpisodes:
                  prev.totalEpisodes <= 1 ? 24 : prev.totalEpisodes,
                episode:
                  prev.episode === 1 && prev.totalEpisodes <= 1
                    ? 1
                    : prev.episode,
                updateDay:
                  prev.updateDay === "Trọn bộ" ? "Thứ 7" : prev.updateDay,
              }));
            }}
          >
            <Tv size={16} />
            <div>
              <b>Phim bộ (Series)</b>
              <small>Nhiều tập, cập nhật theo tuần</small>
            </div>
          </button>

          <button
            type="button"
            className={`type-btn ${movieType === "single" ? "active" : ""}`}
            onClick={() => {
              setMovieType("single");
              setForm((prev) => ({
                ...prev,
                episode: 1,
                totalEpisodes: 1,
                status:
                  prev.status === "Sắp chiếu" ? "Sắp chiếu" : "Hoàn thành",
                updateDay: "Trọn bộ",
              }));
            }}
          >
            <Film size={16} />
            <div>
              <b>Phim lẻ / Bản Full</b>
              <small>Thuyết minh trọn bộ, 1 tập duy nhất</small>
            </div>
          </button>
        </div>

        <div className="form-three">
          <label>
            Năm phát hành
            <input
              type="number"
              min="2000"
              max="2100"
              required
              value={form.year}
              onChange={(event) =>
                setForm({ ...form, year: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Thời lượng (phút)
            <input
              type="number"
              min="1"
              max="300"
              required
              value={form.duration}
              onChange={(event) =>
                setForm({ ...form, duration: Number(event.target.value) })
              }
            />
            {videoBadge && (
              <small className="input-help success">{videoBadge}</small>
            )}
          </label>
          <label>
            Chất lượng
            <select
              value={form.quality}
              onChange={(event) =>
                setForm({
                  ...form,
                  quality: event.target.value as Movie["quality"],
                })
              }
            >
              <option>4K</option>
              <option>Full HD</option>
            </select>
          </label>
        </div>

        {/* LOGIC TẬP PHIM: Ẩn/hiển thị thông minh theo phim bộ / phim lẻ */}
        {movieType === "single" ? (
          <div className="single-movie-notice">
            <Sparkles size={16} />
            <span>
              <b>Chế độ Phim lẻ (Bản Full):</b> Tự động cấu hình 1 tập trọn bộ.
              Không cần quản lý tập hiện tại hay lịch chiếu hàng tuần.
            </span>
          </div>
        ) : (
          <div className="form-two">
            <label>
              Tập hiện tại (đã phát hành)
              <input
                type="number"
                min="1"
                max={form.totalEpisodes}
                value={form.episode}
                onChange={(event) =>
                  handleEpisodeCountChange(Number(event.target.value))
                }
              />
              <small
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  marginTop: 4,
                  display: "block",
                }}
              >
                Số tập đã ra (ví dụ 2). Nếu có video ghép 1-3 thì nhập 3.
              </small>
            </label>
            <label>
              Tổng số tập
              <input
                type="number"
                min="1"
                value={form.totalEpisodes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    totalEpisodes: Number(event.target.value),
                  })
                }
              />
              <small
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  marginTop: 4,
                  display: "block",
                }}
              >
                Tổng số tập toàn bộ phim (ví dụ 23 hoặc 30).
              </small>
            </label>
          </div>
        )}

        <div className="form-two">
          <label>
            Trạng thái
            <select
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as Movie["status"],
                })
              }
            >
              <option>Đang chiếu</option>
              <option>Hoàn thành</option>
              <option>Sắp chiếu</option>
            </select>
          </label>

          <label>
            {movieType === "single" ? "Định dạng phát hành" : "Lịch cập nhật"}
            {movieType === "single" ? (
              <input
                readOnly
                value="Trọn bộ (Bản Full)"
                className="input-disabled"
              />
            ) : (
              <select
                value={form.updateDay}
                onChange={(event) =>
                  setForm({ ...form, updateDay: event.target.value })
                }
              >
                {[
                  "Thứ 2",
                  "Thứ 3",
                  "Thứ 4",
                  "Thứ 5",
                  "Thứ 6",
                  "Thứ 7",
                  "Chủ nhật",
                ].map((day) => (
                  <option key={day}>{day}</option>
                ))}
              </select>
            )}
          </label>
        </div>

        {/* PHẦN 3: KHO MEDIA & TẢI TỆP */}
        <div className="form-section-title">
          <b>Kho media & Tải tệp</b>
          <span>
            {movieType === "series"
              ? "Quản lý video từng tập phim và tệp ảnh poster, phụ đề, âm thanh."
              : "Hỗ trợ dán URL trực tiếp hoặc tải tệp lên Cloudflare R2 an toàn."}
          </span>
        </div>

        {movieType === "series" ? (
          <div className="series-episodes-manager">
            <div className="series-ep-header">
              <div className="series-ep-heading">
                <Film size={18} />
                <div>
                  <strong>Danh sách video từng tập</strong>
                  <p>
                    Đã nạp video cho{" "}
                    <b>
                      {episodes.filter((e) => Boolean(e.video)).length}/
                      {episodes.length}
                    </b>{" "}
                    tập. Nhấn vào từng tập để tải tệp hoặc bấm tải hàng loạt.
                  </p>
                </div>
              </div>
              <div className="series-ep-actions">
                <button
                  type="button"
                  className="bulk-upload-btn"
                  onClick={() => bulkFileInputRef.current?.click()}
                  disabled={bulkUploading}
                  title="Chọn nhiều file video cùng lúc để hệ thống tự động tải và gán vào các tập"
                >
                  <Sparkles size={14} /> ⚡ Tải nhiều tập cùng lúc
                </button>
                <input
                  type="file"
                  ref={bulkFileInputRef}
                  multiple
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  style={{ display: "none" }}
                  onChange={(e) => void handleBulkUpload(e)}
                />
                <button
                  type="button"
                  className="add-episode-btn"
                  onClick={handleAddEpisode}
                >
                  <Plus size={14} />
                  Thêm Tập {episodes.length + 1}
                </button>
              </div>
            </div>

            {bulkProgress && (
              <div className="bulk-progress-notice">
                <Sparkles size={14} /> {bulkProgress}
              </div>
            )}

            {/* THANH CHỌN TAB CÁC TẬP */}
            <div className="episodes-tab-bar">
              {episodes.map((ep) => {
                const hasVideo = Boolean(ep.video);
                const isSelected = ep.episode === selectedEpTab;
                return (
                  <button
                    type="button"
                    key={ep.episode}
                    className={`ep-tab-item ${isSelected ? "selected" : ""} ${hasVideo ? "has-video" : "missing-video"}`}
                    onClick={() => setSelectedEpTab(ep.episode)}
                  >
                    <span>{ep.title?.trim() || `Tập ${ep.episode}`}</span>
                    {hasVideo ? (
                      <Check size={12} className="check-icon" />
                    ) : (
                      <span className="dot-warn" title="Chưa có video" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* KHUNG TẢI VIDEO CHO TẬP ĐANG CHỌN */}
            <div className="selected-episode-box">
              <div className="selected-episode-meta">
                <div>
                  <h4>
                    Đang cấu hình:{" "}
                    {episodes
                      .find((e) => e.episode === selectedEpTab)
                      ?.title?.trim() || `Tập ${selectedEpTab}`}
                  </h4>
                  <small>
                    {episodes.find((e) => e.episode === selectedEpTab)?.video
                      ? "✅ Đã có video cho tập này"
                      : "⚠️ Tập này chưa có video — hãy tải lên hoặc dán URL bên dưới"}
                  </small>
                </div>
                {episodes.length > 1 && (
                  <button
                    type="button"
                    className="delete-ep-btn"
                    onClick={() => handleRemoveEpisode(selectedEpTab)}
                    title={`Xóa Tập ${selectedEpTab}`}
                  >
                    <Trash2 size={14} /> Xóa tập này
                  </button>
                )}
              </div>

              {/* Ô NHẬP TÊN TẬP TÙY CHỈNH (HỖ TRỢ TẬP GHÉP NHƯ 1-3) */}
              <div className="ep-title-field" style={{ marginBottom: 14 }}>
                <label className="field">
                  <span style={{ fontWeight: 600 }}>
                    Tên hiển thị tập (Tiêu đề)
                  </span>
                  <input
                    type="text"
                    value={
                      episodes.find((e) => e.episode === selectedEpTab)
                        ?.title ?? `Tập ${selectedEpTab}`
                    }
                    onChange={(e) =>
                      handleEpisodeTitleChange(selectedEpTab, e.target.value)
                    }
                    placeholder={`Ví dụ: Tập ${selectedEpTab}, Tập 1-3, Tập Đặc Biệt...`}
                  />
                  <small
                    style={{
                      color: "var(--text-muted)",
                      marginTop: 4,
                      display: "block",
                      lineHeight: 1.4,
                    }}
                  >
                    💡 <b>Cách viết khi có video ghép (ví dụ 1 đến 3):</b> Bạn
                    nhập <b>Tập 1-3</b> (hoặc <b>1-3</b>). Hệ thống sẽ tự động
                    hiển thị <b>Tập 1-3/{form.totalEpisodes}</b> ra ngoài thẻ
                    phim và người xem sẽ thấy rõ video gộp này!
                  </small>
                </label>
              </div>

              {selectedEpTab > 1 &&
                episodes.find((e) => e.episode === 1)?.video &&
                !episodes.find((e) => e.episode === selectedEpTab)?.video && (
                  <div style={{ marginBottom: 12 }}>
                    <button
                      type="button"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        padding: "6px 12px",
                        background: "rgba(59, 130, 246, 0.1)",
                        color: "#3b82f6",
                        border: "1px dashed rgba(59, 130, 246, 0.4)",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const ep1Video = episodes.find(
                          (e) => e.episode === 1,
                        )?.video;
                        if (ep1Video) {
                          handleEpisodeVideoChange(selectedEpTab, ep1Video);
                        }
                      }}
                    >
                      🔗 Dùng chung tệp video với Tập 1
                    </button>
                  </div>
                )}

              <MediaUploader
                key={`ep-${selectedEpTab}`}
                movieId={form.id}
                movieSlug={form.slug || toSlug(form.title) || ""}
                category="video"
                label={`Tệp video cho ${episodes.find((e) => e.episode === selectedEpTab)?.title?.trim() || `Tập ${selectedEpTab}`}`}
                value={
                  episodes.find((e) => e.episode === selectedEpTab)?.video || ""
                }
                onChange={(videoKey) =>
                  handleEpisodeVideoChange(selectedEpTab, videoKey)
                }
                onFileSelect={
                  selectedEpTab === 1
                    ? (file) => void handleVideoChange(file)
                    : undefined
                }
                infoBadge={selectedEpTab === 1 ? videoBadge : undefined}
              />
            </div>
          </div>
        ) : (
          <div className="media-upload-grid">
            <MediaUploader
              movieId={form.id}
              movieSlug={form.slug || toSlug(form.title) || ""}
              category="video"
              label={
                form.status === "Sắp chiếu"
                  ? "Video phim (Tùy chọn - Phim sắp chiếu chưa cần video chính)"
                  : "Video phim trọn bộ (Bản Full)"
              }
              value={form.video}
              onChange={(video) => {
                setForm((prev) => ({ ...prev, video }));
                if (video) void handleVideoChange(video);
              }}
              onFileSelect={(file) => void handleVideoChange(file)}
              infoBadge={videoBadge}
            />
          </div>
        )}

        <div className="media-upload-grid secondary-media-grid">
          <MediaUploader
            movieId={form.id}
            movieSlug={form.slug || toSlug(form.title) || ""}
            category="poster"
            label="Poster"
            value={form.poster}
            onChange={(poster) => {
              setForm((prev) => ({ ...prev, poster }));
              if (poster) void handlePosterChange(poster);
            }}
            onFileSelect={(file) => void handlePosterChange(file)}
            infoBadge={posterBadge}
          />
          <MediaUploader
            movieId={form.id}
            movieSlug={form.slug || toSlug(form.title) || ""}
            category="video"
            label="🎬 Trailer (Tùy chọn)"
            value={form.trailer}
            onChange={(trailer) => setForm((prev) => ({ ...prev, trailer }))}
          />
          <MediaUploader
            movieId={form.id}
            movieSlug={form.slug || toSlug(form.title) || ""}
            category="subtitle"
            label="Phụ đề (VTT)"
            value={form.subtitle}
            onChange={(subtitle) => setForm((prev) => ({ ...prev, subtitle }))}
          />
          <MediaUploader
            movieId={form.id}
            movieSlug={form.slug || toSlug(form.title) || ""}
            category="audio"
            label="Audio bổ sung"
            value={form.audio}
            onChange={(audio) => setForm((prev) => ({ ...prev, audio }))}
          />
        </div>

        {/* PHẦN 4: THỂ LOẠI VÀ MÀU SẮC */}
        <div className="form-section-title">
          <b>Phân loại và hiển thị</b>
          <span>Thể loại, bảng màu poster và thông số đánh giá</span>
        </div>
        <div className="genre-options">
          {genres
            .filter((genre) => genre !== "Tất cả")
            .map((genre) => (
              <label
                key={genre}
                className={form.genres.includes(genre) ? "selected" : ""}
              >
                <input
                  type="checkbox"
                  checked={form.genres.includes(genre)}
                  onChange={() => toggleGenre(genre)}
                />
                {genre}
              </label>
            ))}
        </div>

        <div className="form-three">
          <label>
            Điểm đánh giá
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={form.rating}
              onChange={(event) =>
                setForm({ ...form, rating: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Lượt xem
            <input
              type="number"
              min="0"
              value={form.views}
              onChange={(event) =>
                setForm({ ...form, views: Number(event.target.value) })
              }
            />
          </label>
          <label className="featured-toggle">
            <span>Phim nổi bật</span>
            <input
              type="checkbox"
              checked={Boolean(form.featured)}
              onChange={(event) =>
                setForm({ ...form, featured: event.target.checked })
              }
            />
          </label>
        </div>

        <label>
          Mô tả
          <textarea
            required
            minLength={30}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </label>
        <div className="form-actions">
          <button type="button" className="secondary-btn" onClick={close}>
            Hủy
          </button>
          <button className="primary-btn">
            <Save /> Lưu phim
          </button>
        </div>
      </form>
    </div>
  );
}
