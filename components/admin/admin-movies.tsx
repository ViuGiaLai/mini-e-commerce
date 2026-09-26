"use client";

import { useEffect, useState } from "react";
import { Copy, Filter, Pencil, Search, Star, Trash2 } from "lucide-react";
import { MovieArt } from "@/components/ui/movie-art";
import {
  formatCompactNumber as compact,
  formatMovieBadge,
  toSlug,
} from "@/lib/format";
import { genres, type Movie } from "@/lib/movies";
import type { EditMovie, PatchMovie } from "@/components/admin/types";

type AdminMoviesProps = {
  movies: Movie[];
  edit: EditMovie;
  remove: (id: number) => Promise<void>;
  removeMany: (ids: number[]) => Promise<void>;
  duplicate: (movie: Movie) => Promise<void>;
  patchMovie: PatchMovie;
  pageSize: number;
};

export default function AdminMovies({
  movies,
  edit,
  remove,
  removeMany,
  duplicate,
  patchMovie,
  pageSize,
}: AdminMoviesProps) {
  const [keyword, setKeyword] = useState("");
  const [format, setFormat] = useState("Tất cả");
  const [status, setStatus] = useState("Tất cả");
  const [genre, setGenre] = useState("Tất cả");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const filteredList = movies
    .filter((movie: Movie) => {
      const target =
        `${movie.title} ${movie.originalTitle} ${movie.studio}`.toLowerCase();
      const matchFormat =
        format === "Tất cả" ||
        (format === "Phim bộ"
          ? movie.totalEpisodes > 1
          : movie.totalEpisodes <= 1);
      return (
        target.includes(keyword.trim().toLowerCase()) &&
        matchFormat &&
        (status === "Tất cả" || movie.status === status) &&
        (genre === "Tất cả" || movie.genres.includes(genre))
      );
    })
    .sort((a: Movie, b: Movie) => {
      if (sort === "views") return b.views - a.views;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "title") return a.title.localeCompare(b.title, "vi");
      return b.id - a.id;
    });
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const list = filteredList.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const currentPageIds = list.map((movie: Movie) => movie.id);
  const allCurrentSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id: number) => selected.includes(id));
  useEffect(() => setPage(1), [keyword, format, status, genre, sort, pageSize]);
  const toggleAll = () => {
    setSelected((current) =>
      allCurrentSelected
        ? current.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...current, ...currentPageIds])],
    );
  };
  const toggle = (id: number) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };
  return (
    <section className="admin-library">
      <div className="admin-toolbar">
        <div className="catalog-search">
          <Search />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm tên phim..."
          />
        </div>
        <div className="admin-filters">
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          >
            <option value="Tất cả">Tất cả định dạng</option>
            <option value="Phim bộ">Phim bộ (Series)</option>
            <option value="Phim lẻ">Phim lẻ (Bản Full)</option>
          </select>
          <label>
            <Filter />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>Tất cả trạng thái</option>
              <option>Đang chiếu</option>
              <option>Hoàn thành</option>
              <option>Sắp chiếu</option>
            </select>
          </label>
          <select
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
          >
            {genres.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Mới thêm</option>
            <option value="views">Nhiều lượt xem</option>
            <option value="rating">Điểm cao nhất</option>
            <option value="title">Tên A–Z</option>
          </select>
        </div>
      </div>
      <div className="admin-bulkbar">
        <span>
          <b>{filteredList.length}</b> phim · <b>{selected.length}</b> đã chọn
        </span>
        {selected.length > 0 && (
          <button
            className="danger-action"
            onClick={() => {
              removeMany(selected);
              setSelected([]);
            }}
          >
            <Trash2 /> Xóa đã chọn
          </button>
        )}
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allCurrentSelected}
                  onChange={toggleAll}
                  aria-label="Chọn tất cả"
                />
              </th>
              <th>Phim</th>
              <th>Thông tin</th>
              <th>Tiến độ</th>
              <th>Lịch chiếu</th>
              <th>Trạng thái</th>
              <th>Hiệu suất</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((movie: Movie) => (
              <tr key={movie.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(movie.id)}
                    onChange={() => toggle(movie.id)}
                    aria-label={`Chọn ${movie.title}`}
                  />
                </td>
                <td>
                  <MovieArt movie={movie} />
                  <span>
                    <b>{movie.title}</b>
                    <small>{movie.originalTitle}</small>
                    <em>{movie.genres.join(" · ")}</em>
                  </span>
                </td>
                <td>
                  <b>
                    {movie.year} · {movie.quality}
                  </b>
                  <small>
                    {movie.studio}
                    <br />
                    {movie.duration}{" "}
                    {movie.totalEpisodes <= 1 ? "phút (Full)" : "phút/tập"}
                  </small>
                </td>
                <td>
                  <b>
                    {movie.totalEpisodes <= 1
                      ? "Bản Full (1 tập)"
                      : formatMovieBadge(movie).replace(/^Tập\s+/i, "")}
                  </b>
                  <div className="table-progress">
                    <i
                      style={{
                        width: `${movie.totalEpisodes <= 1 ? 100 : (movie.episode / movie.totalEpisodes) * 100}%`,
                      }}
                    />
                  </div>
                </td>
                <td>
                  <b>
                    {movie.totalEpisodes <= 1 ? "Trọn bộ" : movie.updateDay}
                  </b>
                  <small>
                    {movie.totalEpisodes <= 1
                      ? "Phim lẻ / Thuyết minh"
                      : movie.status === "Đang chiếu"
                        ? "Cập nhật hàng tuần"
                        : "Không có lịch mới"}
                  </small>
                </td>
                <td>
                  <button
                    className={`status-pill status-${toSlug(movie.status)}`}
                    onClick={() =>
                      patchMovie(movie.id, {
                        status:
                          movie.status === "Đang chiếu"
                            ? "Hoàn thành"
                            : "Đang chiếu",
                      })
                    }
                  >
                    {movie.status}
                  </button>
                  {movie.featured && (
                    <small className="featured-label">
                      <Star /> Nổi bật
                    </small>
                  )}
                </td>
                <td>
                  <b>{compact(movie.views)} lượt</b>
                  <small>
                    <Star /> {movie.rating.toFixed(1)} điểm
                  </small>
                </td>
                <td>
                  <button title="Nhân bản" onClick={() => duplicate(movie)}>
                    <Copy />
                  </button>
                  <button title="Chỉnh sửa" onClick={() => edit(movie)}>
                    <Pencil />
                  </button>
                  <button
                    title="Xóa"
                    className="delete-icon"
                    onClick={() => remove(movie.id)}
                  >
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <div className="admin-empty">
            <Search />
            <b>Không tìm thấy phim phù hợp</b>
            <span>Hãy thay đổi từ khóa hoặc bộ lọc.</span>
          </div>
        )}
      </div>
      {filteredList.length > pageSize && (
        <div className="admin-pagination">
          <span>
            Trang {safePage}/{totalPages} · Hiển thị {list.length} phim
          </span>
          <div>
            <button
              disabled={safePage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .slice(Math.max(0, safePage - 3), safePage + 2)
              .map((item) => (
                <button
                  key={item}
                  className={item === safePage ? "active" : ""}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ))}
            <button
              disabled={safePage === totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
