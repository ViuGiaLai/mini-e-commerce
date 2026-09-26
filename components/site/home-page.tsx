"use client";

import { Eye, Heart, Play } from "lucide-react";
import { MovieArt } from "@/components/ui/movie-art";
import { formatCompactNumber as compact, formatMovieBadge } from "@/lib/format";
import type { Movie } from "@/lib/movies";
import type { MovieCollectionProps, Navigate } from "@/components/site/types";

export default function HomePage({
  movies,
  go,
  favorites,
  toggleFavorite,
}: MovieCollectionProps) {
  const sortedMovies = [...movies].sort((a: Movie, b: Movie) => b.id - a.id);
  const upcoming = sortedMovies
    .filter((movie: Movie) => movie.status === "Sắp chiếu")
    .slice(0, 6);
  const updated = sortedMovies
    .filter((movie: Movie) => movie.status !== "Sắp chiếu")
    .slice(0, 12);
  const singleMovies = sortedMovies
    .filter((movie: Movie) => movie.totalEpisodes <= 1)
    .slice(0, 6);
  const hot = [...sortedMovies]
    .sort((a: Movie, b: Movie) =>
      b.views !== a.views ? b.views - a.views : b.id - a.id,
    )
    .slice(0, 8);
  const cultivation = sortedMovies
    .filter((movie: Movie) => movie.genres.includes("Tiên hiệp"))
    .slice(0, 8);
  return (
    <main className="ha-container ha-main">
      <div className="ha-columns">
        <div className="ha-primary">
          <MovieShelf
            title="Sắp chiếu"
            movies={upcoming}
            go={go}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
          <MovieShelf
            title="Phim mới cập nhật"
            movies={updated}
            go={go}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            action={() => go("/phim")}
          />
          {singleMovies.length > 0 && (
            <MovieShelf
              title="Phim lẻ đặc sắc (Bản Full)"
              movies={singleMovies}
              go={go}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              action={() => go("/phim")}
            />
          )}
          <MovieShelf
            title="Đang hot"
            movies={hot}
            go={go}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
          <MovieShelf
            title="Phim tu tiên"
            movies={cultivation}
            go={go}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        </div>
        <Ranking
          movies={[...sortedMovies]
            .sort((a: Movie, b: Movie) =>
              b.views !== a.views ? b.views - a.views : b.id - a.id,
            )
            .slice(0, 10)}
          go={go}
        />
      </div>
      <section className="ha-about">
        <h2>ViuFilm3D là gì?</h2>
        <p>
          ViuFilm3D là website xem phim hoạt hình 3D với thư viện nội dung
          nguyên bản. Toàn bộ tên phim, nội dung, poster và video minh họa đều
          được tạo nội bộ, không sử dụng dữ liệu phim từ bên ngoài.
        </p>
        <p>
          Người xem có thể xem miễn phí, theo dõi phim yêu thích và lưu lịch sử
          xem ngay trên trình duyệt.
        </p>
      </section>
    </main>
  );
}
type MovieShelfProps = MovieCollectionProps & {
  title: string;
  action?: () => void;
};

function MovieShelf({
  title,
  movies,
  go,
  favorites,
  toggleFavorite,
  action,
}: MovieShelfProps) {
  return (
    <section className="ha-section">
      <div className="section-title">
        <h2>{title}</h2>
        <span>{movies.length} phim</span>
        {action && <button onClick={action}>Xem tất cả ›</button>}
      </div>
      <div className="movie-grid">
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
    </section>
  );
}
type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  action?: () => void;
};

export function SectionTitle({ eyebrow, title, action }: SectionTitleProps) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <p>{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action && <button onClick={action}>Xem tất cả ›</button>}
    </div>
  );
}
type MovieCardProps = Omit<MovieCollectionProps, "movies"> & {
  movie: Movie;
};

export function MovieCard({
  movie,
  go,
  favorites,
  toggleFavorite,
}: MovieCardProps) {
  return (
    <article className="movie-card">
      <button className="poster-wrap" onClick={() => go(`/phim/${movie.id}`)}>
        <MovieArt movie={movie} />
        <span className="card-labels">
          <i>{formatMovieBadge(movie)}</i>
          {movie.id % 3 === 0 && <b>Miễn phí</b>}
        </span>
        <span className="play-hover">
          <Play fill="currentColor" />
        </span>
        <span className="card-copy">
          <strong>{movie.title}</strong>
          <small>
            <Eye /> {compact(movie.views)} lượt xem
          </small>
        </span>
      </button>
      <button
        className={`card-heart ${favorites.includes(movie.id) ? "active" : ""}`}
        onClick={() => toggleFavorite(movie.id)}
        aria-label="Yêu thích"
      >
        <Heart fill={favorites.includes(movie.id) ? "currentColor" : "none"} />
      </button>
    </article>
  );
}
function Ranking({ movies, go }: { movies: Movie[]; go: Navigate }) {
  return (
    <aside className="ha-sidebar">
      <section className="ranking">
        <h2>Xem nhiều</h2>
        <ol>
          {movies.map((movie: Movie, index: number) => (
            <li key={movie.id}>
              <span>{index + 1}</span>
              <button onClick={() => go(`/phim/${movie.id}`)}>
                <strong>{movie.title}</strong>
                <small>{formatMovieBadge(movie)}</small>
              </button>
            </li>
          ))}
        </ol>
      </section>
      <section className="side-note">
        <h3>Phim đã theo dõi</h3>
        <p>Đăng nhập để đồng bộ phim yêu thích và lịch sử xem của bạn.</p>
        <button onClick={() => go("/dang-nhap")}>Đăng nhập</button>
      </section>
    </aside>
  );
}
