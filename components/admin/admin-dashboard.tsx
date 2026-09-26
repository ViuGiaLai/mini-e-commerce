"use client";

import {
  ChevronRight,
  Database,
  Eye,
  Film,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { MovieArt } from "@/components/ui/movie-art";
import { formatCompactNumber as compact, formatMovieBadge } from "@/lib/format";
import type { Viewer } from "@/lib/admin-data";
import type { Movie } from "@/lib/movies";
import type { Navigate } from "@/components/admin/types";

type AdminDashboardProps = {
  movies: Movie[];
  viewers: Viewer[];
  go: Navigate;
};

export default function AdminDashboard({
  movies,
  viewers,
  go,
}: AdminDashboardProps) {
  const totalViews = movies.reduce(
    (sum: number, movie: Movie) => sum + movie.views,
    0,
  );
  const averageRating = movies.length
    ? movies.reduce((sum: number, movie: Movie) => sum + movie.rating, 0) /
      movies.length
    : 0;
  const statusSummary = ["Đang chiếu", "Hoàn thành", "Sắp chiếu"].map(
    (status) => ({
      status,
      count: movies.filter((movie: Movie) => movie.status === status).length,
    }),
  );
  const maxStatus = Math.max(...statusSummary.map((item) => item.count), 1);
  const completedEpisodes = movies.reduce(
    (sum: number, movie: Movie) => sum + movie.episode,
    0,
  );
  const totalEpisodes = movies.reduce(
    (sum: number, movie: Movie) => sum + movie.totalEpisodes,
    0,
  );
  return (
    <>
      <div className="admin-stats">
        <div>
          <Film />
          <span>Tổng phim</span>
          <strong>{movies.length}</strong>
          <small>
            {movies.filter((m) => m.totalEpisodes > 1).length} phim bộ ·{" "}
            {movies.filter((m) => m.totalEpisodes <= 1).length} phim lẻ
          </small>
        </div>
        <div>
          <Eye />
          <span>Lượt xem</span>
          <strong>{compact(totalViews)}</strong>
          <small>Dữ liệu mô phỏng</small>
        </div>
        <div>
          <Star />
          <span>Điểm trung bình</span>
          <strong>{averageRating.toFixed(1)}</strong>
          <small>Trên thang 10</small>
        </div>
        <div>
          <Users />
          <span>Người dùng</span>
          <strong>{viewers.length}</strong>
          <small>
            {viewers.filter((viewer: Viewer) => viewer.plan === "VIP").length}{" "}
            tài khoản VIP
          </small>
        </div>
      </div>
      <div className="admin-kpis">
        <article>
          <div>
            <TrendingUp />
            <span>Tiến độ nội dung</span>
          </div>
          <strong>
            {totalEpisodes
              ? Math.round((completedEpisodes / totalEpisodes) * 100)
              : 0}
            %
          </strong>
          <div className="admin-progress">
            <i
              style={{
                width: `${totalEpisodes ? (completedEpisodes / totalEpisodes) * 100 : 0}%`,
              }}
            />
          </div>
          <small>
            {completedEpisodes}/{totalEpisodes} tập đã phát hành
          </small>
        </article>
        <article>
          <div>
            <ShieldCheck />
            <span>Tài khoản hoạt động</span>
          </div>
          <strong>
            {
              viewers.filter(
                (viewer: Viewer) => viewer.status === "Đang hoạt động",
              ).length
            }
          </strong>
          <small>
            {
              viewers.filter((viewer: Viewer) => viewer.status === "Đã khóa")
                .length
            }{" "}
            tài khoản đang bị khóa
          </small>
        </article>
        <article>
          <div>
            <Database />
            <span>Chất lượng thư viện</span>
          </div>
          <strong>
            {movies.filter((movie: Movie) => movie.quality === "4K").length}
          </strong>
          <small>
            phim 4K · {movies.filter((movie: Movie) => movie.featured).length}{" "}
            phim nổi bật
          </small>
        </article>
      </div>
      <div className="admin-panels">
        <section>
          <div className="admin-panel-title">
            <div>
              <h2>Phim xem nhiều nhất</h2>
              <span>Xếp hạng theo tổng lượt xem</span>
            </div>
            <button onClick={() => go("/admin/phim")}>
              Quản lý <ChevronRight />
            </button>
          </div>
          {[...movies]
            .sort((a: Movie, b: Movie) => b.views - a.views)
            .slice(0, 6)
            .map((movie: Movie, index: number) => (
              <div className="admin-rank" key={movie.id}>
                <b>{index + 1}</b>
                <span>
                  {movie.title}
                  <small>{compact(movie.views)} lượt xem</small>
                </span>
                <i style={{ width: `${movie.views / 25000}%` }} />
              </div>
            ))}
        </section>
        <section>
          <div className="admin-panel-title">
            <div>
              <h2>Trạng thái thư viện</h2>
              <span>Phân bổ nội dung hiện tại</span>
            </div>
          </div>
          <div className="status-chart">
            {statusSummary.map((item) => (
              <div key={item.status}>
                <span>
                  {item.status}
                  <b>{item.count}</b>
                </span>
                <i>
                  <em style={{ width: `${(item.count / maxStatus) * 100}%` }} />
                </i>
              </div>
            ))}
          </div>
          <div className="admin-panel-title schedule-title">
            <div>
              <h2>Lịch tuần</h2>
              <span>Số phim cập nhật theo ngày</span>
            </div>
          </div>
          {[
            "Thứ 2",
            "Thứ 3",
            "Thứ 4",
            "Thứ 5",
            "Thứ 6",
            "Thứ 7",
            "Chủ nhật",
          ].map((day) => (
            <p className="admin-schedule" key={day}>
              <b>{day}</b>
              <span>
                {
                  movies.filter(
                    (movie: Movie) =>
                      movie.updateDay === day && movie.status === "Đang chiếu",
                  ).length
                }{" "}
                phim
              </span>
            </p>
          ))}
        </section>
      </div>
      <section className="admin-recent">
        <div className="admin-panel-title">
          <div>
            <h2>Nội dung cần chú ý</h2>
            <span>Phim sắp hoàn thành hoặc chưa có lượt xem</span>
          </div>
          <button onClick={() => go("/admin/lich-chieu")}>
            Xem lịch <ChevronRight />
          </button>
        </div>
        <div className="admin-alert-grid">
          {movies
            .filter(
              (movie: Movie) =>
                movie.views === 0 || movie.totalEpisodes - movie.episode <= 3,
            )
            .slice(0, 6)
            .map((movie: Movie) => (
              <article key={movie.id}>
                <MovieArt movie={movie} />
                <div>
                  <b>{movie.title}</b>
                  <span>
                    {movie.status} · {formatMovieBadge(movie)}
                  </span>
                </div>
                <i className="status-pill">
                  {movie.views === 0 ? "Chưa có lượt xem" : "Sắp hoàn thành"}
                </i>
              </article>
            ))}
        </div>
      </section>
    </>
  );
}
