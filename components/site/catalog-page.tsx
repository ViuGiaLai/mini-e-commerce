"use client";

import { useMemo } from "react";
import { RotateCcw, Search, Sparkles } from "lucide-react";
import { MovieCard } from "@/components/site/home-page";
import { EmptyState } from "@/components/site/library-pages";
import { genres, type Movie } from "@/lib/movies";
import type { Dispatch, SetStateAction } from "react";
import type {
  MovieCollectionProps,
  MovieFormat,
  MovieSortOption,
  MovieStatusFilter,
} from "@/components/site/types";

type CatalogPageProps = MovieCollectionProps & {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  genre: string;
  setGenre: Dispatch<SetStateAction<string>>;
  format: MovieFormat;
  setFormat: Dispatch<SetStateAction<MovieFormat>>;
  statusFilter: MovieStatusFilter;
  setStatusFilter: Dispatch<SetStateAction<MovieStatusFilter>>;
  sort: MovieSortOption;
  setSort: Dispatch<SetStateAction<MovieSortOption>>;
  onlyFree: boolean;
  setOnlyFree: Dispatch<SetStateAction<boolean>>;
};

export default function CatalogPage({
  movies,
  query,
  setQuery,
  genre,
  setGenre,
  format,
  setFormat,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
  onlyFree,
  setOnlyFree,
  go,
  favorites,
  toggleFavorite,
}: CatalogPageProps) {
  const filtered = useMemo(() => {
    let list = movies.filter((movie: Movie) => {
      const matchQuery = (
        movie.title +
        " " +
        movie.originalTitle +
        " " +
        movie.genres.join(" ")
      )
        .toLocaleLowerCase("vi")
        .includes(query.trim().toLocaleLowerCase("vi"));
      const matchGenre = genre === "Tất cả" || movie.genres.includes(genre);
      const matchFormat =
        format === "all" ||
        (format === "series"
          ? movie.totalEpisodes > 1
          : movie.totalEpisodes <= 1);
      const matchStatus =
        statusFilter === "all" || movie.status === statusFilter;
      const matchFree = !onlyFree || movie.id % 3 === 0;

      return (
        matchQuery && matchGenre && matchFormat && matchStatus && matchFree
      );
    });

    if (sort === "rating")
      list = [...list].sort((a: Movie, b: Movie) =>
        b.rating !== a.rating ? b.rating - a.rating : b.id - a.id,
      );
    else if (sort === "views")
      list = [...list].sort((a: Movie, b: Movie) =>
        b.views !== a.views ? b.views - a.views : b.id - a.id,
      );
    else if (sort === "year")
      list = [...list].sort((a: Movie, b: Movie) =>
        b.year !== a.year ? b.year - a.year : b.id - a.id,
      );
    else list = [...list].sort((a: Movie, b: Movie) => b.id - a.id);
    return list;
  }, [movies, query, genre, format, statusFilter, onlyFree, sort]);

  const hasActiveFilters =
    query.trim() !== "" ||
    genre !== "Tất cả" ||
    format !== "all" ||
    statusFilter !== "all" ||
    onlyFree ||
    sort !== "new";

  const resetAllFilters = () => {
    setQuery("");
    setGenre("Tất cả");
    setFormat("all");
    setStatusFilter("all");
    setOnlyFree(false);
    setSort("new");
  };

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>KHO PHIM VIUFILM3D</p>
        <h1>Khám phá thế giới hoạt hình 3D</h1>
        <span>
          Hiển thị {filtered.length} / {movies.length} bộ phim
          {format === "single" && " · Lọc theo Phim lẻ"}
          {format === "series" && " · Lọc theo Phim bộ"}
          {statusFilter !== "all" && ` · ${statusFilter}`}
          {onlyFree && " · Miễn phí"}
        </span>
      </div>

      {/* THANH ĐIỀU HƯỚNG BỘ LỌC ĐỊNH DẠNG VÀ TÌM KIẾM */}
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên phim, thể loại..."
          />
        </div>

        {/* BỘ LỌC ĐỊNH DẠNG: PHIM BỘ / PHIM LẺ */}
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value as MovieFormat)}
        >
          <option value="all">Tất cả định dạng</option>
          <option value="series">Phim bộ (Nhiều tập)</option>
          <option value="single">Phim lẻ (Bản Full)</option>
        </select>

        {/* BỘ LỌC TRẠNG THÁI */}
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as MovieStatusFilter)
          }
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Đang chiếu">Đang chiếu</option>
          <option value="Hoàn thành">Hoàn thành</option>
          <option value="Sắp chiếu">Sắp chiếu</option>
        </select>

        {/* SẮP XẾP */}
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as MovieSortOption)}
        >
          <option value="new">Mới cập nhật</option>
          <option value="views">Xem nhiều nhất</option>
          <option value="rating">Đánh giá cao</option>
          <option value="year">Năm phát hành</option>
        </select>

        {/* NÚT LỌC MIỄN PHÍ */}
        <button
          type="button"
          className={`filter-btn-toggle ${onlyFree ? "active" : ""}`}
          onClick={() => setOnlyFree(!onlyFree)}
          title="Chỉ hiển thị phim xem miễn phí"
        >
          <Sparkles size={14} /> Miễn phí
        </button>

        {/* NÚT RESET BỘ LỌC */}
        {hasActiveFilters && (
          <button
            type="button"
            className="filter-reset-btn"
            onClick={resetAllFilters}
            title="Xóa tất cả bộ lọc"
          >
            <RotateCcw size={14} /> Đặt lại
          </button>
        )}
      </div>

      {/* DANH SÁCH THỂ LOẠI */}
      <div className="genre-pills">
        {genres.map((item) => (
          <button
            key={item}
            className={genre === item ? "active" : ""}
            onClick={() => setGenre(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="movie-grid catalog-grid">
          {filtered.map((movie: Movie) => (
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
          text="Không tìm thấy phim phù hợp với bộ lọc hiện tại."
          action="Xóa bộ lọc"
          onClick={resetAllFilters}
        />
      )}
    </main>
  );
}
