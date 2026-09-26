"use client";

import { Clapperboard, Play, Trash2 } from "lucide-react";
import { MovieCard } from "@/components/site/home-page";
import { MovieArt } from "@/components/ui/movie-art";
import type { HistoryItem } from "@/lib/app-types";
import {
  storageKeys as storage,
  writeStorage as write,
} from "@/lib/client-storage";
import type { Movie } from "@/lib/movies";
import type {
  HistoryPageProps,
  MovieCollectionProps,
  Navigate,
} from "@/components/site/types";

type LibraryPageProps = MovieCollectionProps & {
  title: string;
  eyebrow: string;
  empty: string;
};

export default function LibraryPage({
  title,
  eyebrow,
  movies,
  empty,
  go,
  favorites,
  toggleFavorite,
}: LibraryPageProps) {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{movies.length} phim</span>
      </div>
      {movies.length ? (
        <div className="movie-grid catalog-grid">
          {movies.map((movie: Movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              go={go}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          text={empty}
          action="Khám phá kho phim"
          onClick={() => go("/phim")}
        />
      )}
    </main>
  );
}
export function HistoryPage({
  movies,
  history,
  setHistory,
  go,
  watch,
}: HistoryPageProps) {
  const clear = () => {
    setHistory([]);
    write(storage.history, []);
  };
  return (
    <main className="page-shell">
      <div className="page-heading horizontal">
        <div>
          <p>TIẾP TỤC HÀNH TRÌNH</p>
          <h1>Lịch sử xem</h1>
          <span>{history.length} phim đã xem gần đây</span>
        </div>
        {history.length > 0 && (
          <button className="outline-danger" onClick={clear}>
            <Trash2 /> Xóa lịch sử
          </button>
        )}
      </div>
      {history.length ? (
        <div className="history-list">
          {history.map((item: HistoryItem) => {
            const movie = movies.find(
              (entry: Movie) => entry.id === item.movieId,
            );
            return movie ? (
              <article key={item.movieId}>
                <button onClick={() => go(`/phim/${movie.id}`)}>
                  <MovieArt movie={movie} />
                </button>
                <div>
                  <p>{movie.genres.join(" · ")}</p>
                  <h2>{movie.title}</h2>
                  <span>
                    {movie.totalEpisodes <= 1
                      ? "Đã xem Bản Full"
                      : `Đã xem tập ${item.episode}`}{" "}
                    · {new Date(item.watchedAt).toLocaleDateString("vi-VN")}
                  </span>
                  <div className="progress">
                    <i style={{ width: `${item.progress}%` }} />
                  </div>
                  <button
                    className="primary-btn"
                    onClick={() => watch(movie, item.episode)}
                  >
                    <Play fill="currentColor" />{" "}
                    {movie.totalEpisodes <= 1 ? "Xem lại" : "Xem tiếp"}
                  </button>
                </div>
              </article>
            ) : null;
          })}
        </div>
      ) : (
        <EmptyState
          text="Bạn chưa xem bộ phim nào."
          action="Xem phim ngay"
          onClick={() => go("/phim")}
        />
      )}
    </main>
  );
}
export function EmptyState({
  text,
  action,
  onClick,
}: {
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="empty-state">
      <Clapperboard />
      <h2>{text}</h2>
      <button className="primary-btn" onClick={onClick}>
        {action}
      </button>
    </div>
  );
}
export function NotFoundPage({ go }: { go: Navigate }) {
  return (
    <main className="page-shell">
      <EmptyState
        text="Trang hoặc bộ phim này không tồn tại."
        action="Về trang chủ"
        onClick={() => go("/")}
      />
    </main>
  );
}
