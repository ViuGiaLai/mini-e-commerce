"use client";

import type { CSSProperties } from "react";
import { CalendarDays, Clock3, Eye, Heart, Play, Star } from "lucide-react";
import { MovieArt } from "@/components/ui/movie-art";
import { SectionTitle } from "@/components/site/home-page";
import { formatCompactNumber as compact } from "@/lib/format";
import type { Movie } from "@/lib/movies";
import type {
  Navigate,
  ToggleFavorite,
  WatchMovie,
} from "@/components/site/types";

type MovieDetailProps = {
  movie: Movie;
  watch: WatchMovie;
  go: Navigate;
  favorite: boolean;
  toggleFavorite: ToggleFavorite;
};

export default function MovieDetail({
  movie,
  watch,
  go,
  favorite,
  toggleFavorite,
}: MovieDetailProps) {
  return (
    <main>
      <section
        className="detail-hero"
        style={
          {
            "--hero1": movie.colors[0],
            "--hero2": movie.colors[1],
          } as CSSProperties
        }
      >
        <div className="detail-bg" />
        <div className="detail-inner">
          <MovieArt movie={movie} />
          <div>
            <p className="mini-label">
              {movie.status} · {movie.quality}
            </p>
            <h1>{movie.title}</h1>
            <h2>{movie.originalTitle}</h2>
            <div className="detail-meta">
              <span>
                <Star fill="currentColor" /> {movie.rating}
              </span>
              <span>
                <CalendarDays /> {movie.year}
              </span>
              <span>
                <Clock3 /> {movie.duration}{" "}
                {movie.totalEpisodes <= 1 ? "phút (Bản Full)" : "phút/tập"}
              </span>
              <span>
                <Eye /> {compact(movie.views)}
              </span>
            </div>
            <p className="detail-desc">{movie.description}</p>
            <div className="tag-row">
              {movie.genres.map((item: string) => (
                <b key={item}>{item}</b>
              ))}
            </div>
            <div className="detail-buttons">
              {movie.status === "Sắp chiếu" ? (
                <>
                  {movie.trailer ? (
                    <button
                      className="primary-btn"
                      onClick={() =>
                        go(`/xem/${movie.slug || movie.id}?trailer=1`)
                      }
                      title="Xem Trailer phim"
                      style={{
                        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        boxShadow: "0 0 16px rgba(124, 58, 237, 0.45)",
                      }}
                    >
                      <Play fill="currentColor" /> Xem Trailer
                    </button>
                  ) : null}
                  <button
                    className="glass-btn"
                    disabled
                    style={{ opacity: 0.7, cursor: "not-allowed" }}
                  >
                    <Clock3 size={15} /> Sắp phát hành
                  </button>
                </>
              ) : (
                <>
                  <button className="primary-btn" onClick={() => watch(movie)}>
                    <Play fill="currentColor" />{" "}
                    {movie.totalEpisodes <= 1
                      ? "Xem phim (Bản Full)"
                      : "Xem tập mới nhất"}
                  </button>
                  {movie.trailer && (
                    <button
                      className="glass-btn"
                      onClick={() =>
                        go(`/xem/${movie.slug || movie.id}?trailer=1`)
                      }
                      title="Xem Trailer"
                      style={{
                        background: "rgba(124,58,237,0.18)",
                        color: "#c4b5fd",
                        borderColor: "rgba(167,139,250,0.4)",
                      }}
                    >
                      🎬 Trailer
                    </button>
                  )}
                </>
              )}
              <button
                className={`glass-btn ${favorite ? "liked" : ""}`}
                onClick={() => toggleFavorite(movie.id)}
              >
                <Heart fill={favorite ? "currentColor" : "none"} />{" "}
                {favorite ? "Đã yêu thích" : "Yêu thích"}
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="detail-body">
        <div>
          <SectionTitle
            eyebrow="DANH SÁCH PHÁT"
            title={
              movie.totalEpisodes <= 1 ? "Phát phim trọn bộ" : "Các tập phim"
            }
          />
          <div className="episode-grid">
            {movie.status === "Sắp chiếu" ? (
              <div
                className="upcoming-notice"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Clock3 size={16} />
                  <span>
                    Phim đang trong kế hoạch phát hành năm {movie.year}. Hãy
                    nhấn <b>Yêu thích</b> để không bỏ lỡ lịch chiếu sớm nhất!
                  </span>
                </div>
                {movie.trailer && (
                  <button
                    type="button"
                    className="primary-btn"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      color: "#fff",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                    }}
                    onClick={() =>
                      go(`/xem/${movie.slug || movie.id}?trailer=1`)
                    }
                  >
                    <Play size={14} fill="currentColor" /> Xem Trailer chính
                    thức
                  </button>
                )}
              </div>
            ) : movie.totalEpisodes <= 1 ? (
              <button
                style={{ minWidth: 240, justifyContent: "flex-start", gap: 10 }}
                onClick={() => watch(movie, 1)}
              >
                <Play size={14} /> Bản Full (Thuyết minh)
                <i style={{ marginLeft: "auto" }}>Full</i>
              </button>
            ) : (
              (movie.episodes && movie.episodes.length > 0
                ? movie.episodes.map((e) => e.episode).sort((a, b) => b - a)
                : Array.from(
                    { length: movie.episode },
                    (_, index) => index + 1,
                  ).reverse()
              ).map((ep) => {
                const epObj = movie.episodes?.find((e) => e.episode === ep);
                const epLabel = epObj?.title?.trim() || `Tập ${ep}`;
                return (
                  <button key={ep} onClick={() => watch(movie, ep)}>
                    <Play size={14} /> {epLabel}
                    {ep === movie.episode && <i>Mới</i>}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <aside className="movie-info">
          <h3>Thông tin phim</h3>
          <p>
            <span>Trạng thái</span>
            <b>{movie.status}</b>
          </p>
          <p>
            <span>Hãng phim</span>
            <b>{movie.studio}</b>
          </p>
          <p>
            <span>Đạo diễn</span>
            <b>{movie.director}</b>
          </p>
          <p>
            <span>Định dạng</span>
            <b>
              {movie.totalEpisodes <= 1
                ? "Phim lẻ (Trọn bộ)"
                : `${movie.totalEpisodes} tập`}
            </b>
          </p>
          <p>
            <span>Ngôn ngữ</span>
            <b>Thuyết minh</b>
          </p>
        </aside>
      </section>
    </main>
  );
}
