import { genres, type Movie } from "@/lib/movies";
import { ValidationError } from "@/lib/server/errors";

const statuses: Movie["status"][] = ["Đang chiếu", "Hoàn thành", "Sắp chiếu"];
const qualities: Movie["quality"][] = ["4K", "Full HD"];
const updateDays = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
  "Trọn bộ",
  "Trọn bộ (Bản Full)",
  "Hàng ngày",
  "Cuối tuần",
];
const allowedGenres = new Set(genres.filter((genre) => genre !== "Tất cả"));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const colorPattern = /^#[0-9a-f]{6}$/i;

const isMediaReference = (value: string) =>
  value.startsWith("movies/") ||
  value.startsWith("/") ||
  /^https?:\/\//i.test(value);

const optionalMedia = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !isMediaReference(value.trim())) {
    throw new ValidationError("Đường dẫn media không hợp lệ.");
  }
  return value.trim();
};

export function parseMovie(value: unknown): Movie {
  if (!value || typeof value !== "object") {
    throw new ValidationError("Dữ liệu phim không hợp lệ.");
  }

  const movie = value as Partial<Movie>;
  const requiredText = [
    movie.title,
    movie.originalTitle,
    movie.studio,
    movie.director,
  ];
  if (
    requiredText.some(
      (item) =>
        typeof item !== "string" || !item.trim() || item.trim().length > 160,
    )
  ) {
    throw new ValidationError("Phim đang thiếu trường văn bản bắt buộc.");
  }

  if (!Number.isSafeInteger(movie.id) || Number(movie.id) <= 0) {
    throw new ValidationError("Mã phim không hợp lệ.");
  }

  if (
    typeof movie.slug !== "string" ||
    movie.slug.length > 160 ||
    !slugPattern.test(movie.slug)
  ) {
    throw new ValidationError("Đường dẫn phim không hợp lệ.");
  }

  if (
    typeof movie.description !== "string" ||
    movie.description.trim().length < 30 ||
    movie.description.length > 5000
  ) {
    throw new ValidationError("Mô tả phim phải có từ 30 đến 5.000 ký tự.");
  }

  if (
    !Number.isInteger(movie.year) ||
    Number(movie.year) < 2000 ||
    Number(movie.year) > 2100
  ) {
    throw new ValidationError("Năm phát hành không hợp lệ.");
  }

  if (
    !Number.isInteger(movie.episode) ||
    !Number.isInteger(movie.totalEpisodes) ||
    Number(movie.episode) < 0 ||
    Number(movie.totalEpisodes) < 1 ||
    Number(movie.episode) > Number(movie.totalEpisodes)
  ) {
    throw new ValidationError("Tiến độ tập phim không hợp lệ.");
  }

  if (!statuses.includes(movie.status as Movie["status"])) {
    throw new ValidationError("Trạng thái phim không hợp lệ.");
  }

  if (!qualities.includes(movie.quality as Movie["quality"])) {
    throw new ValidationError("Chất lượng phim không hợp lệ.");
  }

  if (
    !Array.isArray(movie.genres) ||
    movie.genres.length === 0 ||
    movie.genres.length > allowedGenres.size ||
    movie.genres.some(
      (genre) => typeof genre !== "string" || !allowedGenres.has(genre),
    ) ||
    new Set(movie.genres).size !== movie.genres.length
  ) {
    throw new ValidationError("Phim phải có ít nhất một thể loại.");
  }

  if (
    !Array.isArray(movie.colors) ||
    movie.colors.length !== 2 ||
    movie.colors.some(
      (color) => typeof color !== "string" || !colorPattern.test(color),
    )
  ) {
    throw new ValidationError("Màu poster không hợp lệ.");
  }

  const rawVideo = typeof movie.video === "string" ? movie.video.trim() : "";
  const isUpcoming = movie.status === "Sắp chiếu";

  if (!isUpcoming) {
    const hasEpisodesVideo =
      Array.isArray(movie.episodes) &&
      movie.episodes.some(
        (ep) =>
          typeof (ep as { video?: unknown })?.video === "string" &&
          isMediaReference(String((ep as { video: string }).video).trim()),
      );

    if (!rawVideo && !hasEpisodesVideo) {
      throw new ValidationError(
        "Vui lòng tải lên video cho phim (hoặc chuyển trạng thái sang 'Sắp chiếu' nếu phim chưa phát hành).",
      );
    }

    if (rawVideo && !isMediaReference(rawVideo)) {
      throw new ValidationError("Video phim không hợp lệ.");
    }
  } else {
    // Phim Sắp chiếu: Chưa có video phim chính thức là hoàn toàn hợp lệ
    if (rawVideo && !isMediaReference(rawVideo)) {
      throw new ValidationError("Video phim không hợp lệ.");
    }
  }

  if (
    !Number.isFinite(movie.rating) ||
    Number(movie.rating) < 0 ||
    Number(movie.rating) > 10
  ) {
    throw new ValidationError("Điểm đánh giá phải từ 0 đến 10.");
  }
  if (!Number.isSafeInteger(movie.views) || Number(movie.views) < 0) {
    throw new ValidationError("Lượt xem không hợp lệ.");
  }
  if (
    !Number.isInteger(movie.duration) ||
    Number(movie.duration) < 1 ||
    Number(movie.duration) > 300
  ) {
    throw new ValidationError("Thời lượng phim phải từ 1 đến 300 phút.");
  }
  const rawUpdateDay = String(movie.updateDay ?? "").trim();
  if (
    !rawUpdateDay ||
    (!updateDays.includes(rawUpdateDay) && rawUpdateDay.length > 50)
  ) {
    throw new ValidationError("Lịch cập nhật không hợp lệ.");
  }
  if (movie.featured !== undefined && typeof movie.featured !== "boolean") {
    throw new ValidationError("Trạng thái phim nổi bật không hợp lệ.");
  }

  const rawEpisodes = Array.isArray(movie.episodes)
    ? movie.episodes
    : undefined;
  const episodes: Movie["episodes"] = rawEpisodes
    ?.map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const epNum = Number(
        (item as { episode?: unknown }).episode ?? index + 1,
      );
      const vid =
        typeof (item as { video?: unknown }).video === "string"
          ? (item as { video: string }).video.trim()
          : "";
      return {
        episode: epNum,
        video: vid,
        title:
          typeof (item as { title?: unknown }).title === "string"
            ? (item as { title: string }).title.trim()
            : undefined,
      };
    })
    .filter((ep): ep is NonNullable<typeof ep> => ep !== null);

  return {
    ...(movie as Movie),
    slug: movie.slug.trim(),
    title: movie.title!.trim(),
    originalTitle: movie.originalTitle!.trim(),
    studio: movie.studio!.trim(),
    director: movie.director!.trim(),
    description: movie.description.trim(),
    updateDay: rawUpdateDay,
    video: rawVideo,
    episodes: episodes && episodes.length > 0 ? episodes : undefined,
    poster: optionalMedia(movie.poster),
    trailer: optionalMedia(movie.trailer),
    subtitle: optionalMedia(movie.subtitle),
    audio: optionalMedia(movie.audio),
  };
}
