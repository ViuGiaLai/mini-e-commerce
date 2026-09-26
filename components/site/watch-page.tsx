"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Maximize2,
  Minimize2,
  Plus,
  Volume2,
} from "lucide-react";
import type { Movie } from "@/lib/movies";
import type { Navigate, WatchMovie } from "@/components/site/types";
import { mediaGateway } from "@/lib/media-gateway";
import CustomPlayer from "@/components/site/custom-player";

type WatchPageProps = {
  movie: Movie;
  movies?: Movie[];
  go: Navigate;
  onWatch: WatchMovie;
  favorite?: boolean;
  toggleFavorite?: (id: number) => void;
};

export default function WatchPage({
  movie,
  go,
  onWatch,
  favorite = false,
  toggleFavorite,
}: WatchPageProps) {
  const searchParams = useSearchParams();
  const tapQuery = searchParams.get("tap");
  const trailerQuery = searchParams.get("trailer");
  const parsedTap = tapQuery ? Number(tapQuery) : NaN;
  const isSingle = movie.totalEpisodes <= 1;

  const initialEp =
    Number.isInteger(parsedTap) && parsedTap > 0
      ? parsedTap
      : isSingle
        ? 1
        : movie.episode;

  const [episode, setEpisode] = useState(initialEp);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [showTrailer, setShowTrailer] = useState(
    Boolean(trailerQuery) ||
      (movie.status === "Sắp chiếu" && Boolean(movie.trailer)),
  );

  useEffect(() => {
    if (Number.isInteger(parsedTap) && parsedTap > 0) {
      setEpisode(parsedTap);
      setShowTrailer(false);
    }
  }, [parsedTap]);

  // Clean URL if single movie was navigated with ?tap=1 (chỉ xóa nếu có tap=, không xóa trailer)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      isSingle &&
      window.location.search.includes("tap=")
    ) {
      const identifier = movie.slug || movie.id;
      window.history.replaceState(null, "", `/xem/${identifier}`);
    }
  }, [isSingle, movie.slug, movie.id]);

  const trailerVideo = movie.trailer || "";

  const currentEpisodeVideo = showTrailer
    ? trailerVideo
    : isSingle
      ? movie.video
      : movie.episodes?.find((e) => e.episode === episode)?.video ||
        movie.episodes?.find((e) => {
          if (!e.video || !e.title) return false;
          const match = e.title.match(/(\d+)\s*-\s*(\d+)/);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = parseInt(match[2], 10);
            return episode >= start && episode <= end;
          }
          return false;
        })?.video ||
        (episode === 1 ? movie.video : "");

  const [media, setMedia] = useState({
    video: currentEpisodeVideo,
    poster: movie.poster,
    subtitle: movie.subtitle,
    audio: movie.audio,
  });
  const [mediaError, setMediaError] = useState("");

  useEffect(() => {
    let active = true;
    setMediaError("");

    if (!currentEpisodeVideo) {
      setMedia((prev) => ({ ...prev, video: "" }));
      setMediaError(
        showTrailer
          ? "Trailer đang được cập nhật. Vui lòng thử lại sau."
          : `Tập ${episode} đang được cập nhật video. Bạn có thể chọn các tập khác trong danh sách.`,
      );
      return;
    }

    void Promise.all([
      mediaGateway.resolve(currentEpisodeVideo),
      mediaGateway.resolve(movie.poster),
      mediaGateway.resolve(movie.subtitle),
      mediaGateway.resolve(movie.audio),
    ])
      .then(([video, poster, subtitle, audio]) => {
        if (!active) return;
        setMedia({
          video: video || currentEpisodeVideo,
          poster: poster || movie.poster,
          subtitle,
          audio,
        });
      })
      .catch((error) => {
        if (!active) return;
        setMediaError(
          error instanceof Error ? error.message : "Không thể tải media từ R2.",
        );
      });
    return () => {
      active = false;
    };
  }, [movie, episode, currentEpisodeVideo, isSingle]);

  const selectEpisode = (ep: number) => {
    setEpisode(ep);
    onWatch(movie, ep);
    const identifier = movie.slug || movie.id;
    if (typeof window !== "undefined") {
      if (movie.totalEpisodes > 1) {
        window.history.replaceState(null, "", `/xem/${identifier}?tap=${ep}`);
      } else {
        window.history.replaceState(null, "", `/xem/${identifier}`);
      }
    }
  };

  // Reverse list: from newest episode down to 1 (or configured episodes)
  const episodesList =
    movie.episodes && movie.episodes.length > 0
      ? movie.episodes.map((e) => e.episode).sort((a, b) => b - a)
      : Array.from(
          { length: Math.max(1, movie.episode) },
          (_, i) => movie.episode - i,
        );

  const currEpObj = movie.episodes?.find((e) => e.episode === episode);
  const epLabel = showTrailer
    ? "🎬 Trailer"
    : isSingle
      ? "Bản Full (Thuyết minh)"
      : currEpObj?.title?.trim() || `Tập ${episode}`;

  const selectTrailer = () => {
    setShowTrailer(true);
    const identifier = movie.slug || movie.id;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/xem/${identifier}?trailer=1`);
    }
  };

  return (
    <main
      className={`watch-page-container ${isExpanded ? "theater-mode" : ""}`}
    >
      {/* 1. BREADCRUMBS */}
      <nav className="watch-crumbs" aria-label="Breadcrumb">
        <button type="button" onClick={() => go("/")}>
          Trang chủ
        </button>
        <span className="crumb-sep">/</span>
        <button
          type="button"
          onClick={() => go(`/phim/${movie.slug || movie.id}`)}
        >
          {movie.title}
        </button>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{epLabel}</span>
      </nav>

      {/* 2. BỐ CỤC 3 CỘT (CHÍNH XÁC THEO HÌNH 1, 100% DỮ LIỆU THẬT) */}
      <div className="watch-main-columns">
        {/* CỘT 1 (TRÁI): BỘ CHỌN TẬP */}
        <aside className="watch-col-episodes">
          <div className="episodes-header">
            <Film size={15} />
            <span>Danh sách tập</span>
          </div>

          <div className="episode-btn-grid">
            {/* NÚT TRAILER (nếu có) */}
            {trailerVideo && (
              <button
                type="button"
                className={`ep-pill-btn ep-pill-trailer ${showTrailer ? "active" : ""}`}
                onClick={selectTrailer}
                title="Xem Trailer phim"
                style={{ gridColumn: "1 / -1" }}
              >
                🎬 Trailer
              </button>
            )}

            {/* Phim Sắp chiếu: không cho chọn tập */}
            {movie.status === "Sắp chiếu" ? (
              <div className="ep-upcoming-notice">
                <span>📅 Sắp phát hành {movie.year}</span>
                {trailerVideo && <small>Nhấn Trailer để xem trước</small>}
              </div>
            ) : isSingle ? (
              <button
                type="button"
                className={`ep-pill-btn ep-pill-full ${!showTrailer ? "active" : ""}`}
                onClick={() => {
                  setShowTrailer(false);
                  selectEpisode(1);
                }}
              >
                Bản Full (Thuyết minh)
              </button>
            ) : (
              episodesList.map((ep) => {
                const epObj = movie.episodes?.find((e) => e.episode === ep);
                const hasVideo = Boolean(
                  epObj?.video || (ep === 1 && movie.video),
                );
                const epName = epObj?.title?.trim() || `Tập ${ep}`;
                const shortLabel = epObj?.title
                  ? epObj.title.replace(/^Tập\s+/i, "")
                  : `${ep}`;
                return (
                  <button
                    type="button"
                    key={ep}
                    className={`ep-pill-btn ${!showTrailer && ep === episode ? "active" : ""} ${hasVideo ? "" : "ep-pill-pending"}`}
                    onClick={() => {
                      setShowTrailer(false);
                      selectEpisode(ep);
                    }}
                    title={hasVideo ? epName : `${epName} (Chờ cập nhật video)`}
                  >
                    {shortLabel}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* CỘT 2 (GIỮA): KHUNG VIDEO & THANH CHỨC NĂNG */}
        <section className="watch-col-player">
          <div className="player-viewport">
            {media.video ? (
              <CustomPlayer
                key={`player-ep-${episode}-${media.video}`}
                src={media.video}
                poster={media.poster || undefined}
                subtitle={media.subtitle || undefined}
                title={movie.title}
                episodeLabel={epLabel}
                quality={movie.quality}
                movieId={movie.id}
                episodeNumber={episode}
                onPlay={() => onWatch(movie, episode)}
                onEnded={() => {
                  if (!isSingle && episode < movie.totalEpisodes) {
                    selectEpisode(episode + 1);
                  }
                }}
              />
            ) : movie.status === "Sắp chiếu" ? (
              <div className="player-empty-episode">
                <Film size={44} />
                <h3>📅 Phim sắp phát hành</h3>
                <p>
                  <b>{movie.title}</b> dự kiến ra mắt năm {movie.year}.<br />
                  {trailerVideo
                    ? "Nhấn nút Trailer ở danh sách bên trái để xem trước!"
                    : "Nhấn Yêu thích để nhận thông báo khi phim lên sóng."}
                </p>
              </div>
            ) : (
              <div className="player-empty-episode">
                <Film size={44} />
                <h3>Tập {episode} đang được cập nhật</h3>
                <p>
                  Video cho tập này đang được đội ngũ chuẩn bị. Vui lòng chọn
                  tập khác trong danh sách hoặc quay lại sau.
                </p>
              </div>
            )}
            {mediaError && <p className="player-error">{mediaError}</p>}
          </div>

          {/* THANH ĐIỀU HƯỚNG DƯỚI VIDEO (MỞ RỘNG, TẬP TRƯỚC/TIẾP) */}
          <div className="player-actions-bar">
            <div className="actions-left">
              <button
                type="button"
                className="action-btn"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {isExpanded ? "Thu nhỏ" : "Mở rộng"}
              </button>
            </div>

            <div className="actions-right">
              {!isSingle && (
                <>
                  <button
                    type="button"
                    className="nav-ep-btn"
                    disabled={episode <= 1}
                    onClick={() => selectEpisode(Math.max(1, episode - 1))}
                  >
                    <ChevronLeft size={14} /> Tập Trước
                  </button>
                  <button
                    type="button"
                    className="nav-ep-btn"
                    disabled={episode >= movie.totalEpisodes}
                    onClick={() =>
                      selectEpisode(Math.min(movie.totalEpisodes, episode + 1))
                    }
                  >
                    Tập Tiếp <ChevronRight size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* AUDIO BỔ SUNG (NẾU CÓ) */}
          {media.audio && (
            <div className="player-extra-audio">
              <span>
                <Volume2 size={14} /> Kênh Audio bổ sung:
              </span>
              <audio controls preload="metadata" src={media.audio} />
            </div>
          )}
        </section>

        {/* CỘT 3 (PHẢI): SIDEBAR THÔNG TIN PHIM THẬT */}
        <aside className="watch-col-sidebar">
          <h1 className="sidebar-movie-heading">
            {movie.title} {isSingle ? "" : `| Tập ${episode}`}
          </h1>

          <div className="sidebar-schedule-text">
            Lịch chiếu: <span>{movie.updateDay || "Trọn bộ"}</span>
          </div>

          {/* NÚT THÊM YÊU THÍCH HOẠT ĐỘNG THẬT */}
          <button
            type="button"
            className={`sidebar-fav-btn ${favorite ? "favorited" : ""}`}
            onClick={() => toggleFavorite?.(movie.id)}
          >
            {favorite ? (
              <>
                <Check size={16} /> Đã có trong Phim Yêu Thích
              </>
            ) : (
              <>
                <Plus size={16} /> Thêm vào Phim Yêu Thích
              </>
            )}
          </button>

          {/* THÔNG SỐ CHI TIẾT THẬT */}
          <div className="sidebar-details-grid">
            <div className="detail-row">
              <span className="detail-label">Thời lượng:</span>
              <span className="detail-val">
                {isSingle
                  ? `${movie.duration} phút [${movie.quality}]`
                  : `${epLabel}/${movie.totalEpisodes} (${movie.duration} phút) [${movie.quality}]`}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Trạng thái:</span>
              <span className="detail-val">{movie.status}</span>
            </div>
            <div className="detail-row genres-row">
              <span className="detail-label">Thể loại:</span>
              <div className="detail-pills">
                {movie.genres.map((g) => (
                  <span key={g} className="genre-tag">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">Năm:</span>
              <span className="detail-val">{movie.year}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Studio:</span>
              <span className="detail-val">{movie.studio}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Đạo diễn:</span>
              <span className="detail-val">{movie.director}</span>
            </div>
          </div>

          {/* MÔ TẢ PHIM THẬT */}
          <div className="sidebar-desc-wrap">
            <p className={expandedDesc ? "desc-full" : "desc-clamped"}>
              {movie.description}
            </p>
            {movie.description.length > 120 && (
              <button
                type="button"
                className="desc-toggle-btn"
                onClick={() => setExpandedDesc(!expandedDesc)}
              >
                {expandedDesc ? "- Thu gọn" : "+ Xem thêm"}
              </button>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
