import type { Movie } from "@/lib/movies";

const compactFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatCompactNumber = (value: number) =>
  compactFormatter.format(value);

export const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const formatEpisodeProgress = (movie: Movie) => {
  if (movie.status === "Sắp chiếu") return "Sắp chiếu";
  if (movie.totalEpisodes <= 1) return "Bản Full";
  return `${movie.episode}/${movie.totalEpisodes}`;
};

export const formatMovieBadge = (movie: Movie): string => {
  if (movie.status === "Sắp chiếu") return "Sắp chiếu";
  if (movie.totalEpisodes <= 1) return "Bản Full";

  // 1. Kiểm tra xem có tập nào có tiêu đề ghép/khoảng như "Tập 1-3" hoặc "1-3"
  const curEpObj = movie.episodes?.find((e) => e.episode === movie.episode);
  if (curEpObj?.title && /\d+\s*-\s*\d+/.test(curEpObj.title)) {
    const match = curEpObj.title.match(/\d+\s*-\s*\d+/);
    if (match) return `Tập ${match[0]}/${movie.totalEpisodes}`;
  }

  if (movie.episodes && movie.episodes.length > 0) {
    const rangeEp = movie.episodes
      .slice()
      .reverse()
      .find(
        (e) => Boolean(e.video) && e.title && /\d+\s*-\s*\d+/.test(e.title),
      );
    if (rangeEp?.title) {
      const match = rangeEp.title.match(/\d+\s*-\s*\d+/);
      if (match) return `Tập ${match[0]}/${movie.totalEpisodes}`;
    }
  }

  if (movie.status === "Hoàn thành") {
    return `Trọn bộ ${movie.totalEpisodes}/${movie.totalEpisodes}`;
  }

  return `Tập ${movie.episode}/${movie.totalEpisodes}`;
};
