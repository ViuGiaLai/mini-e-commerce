"use client";

import {
  CalendarDays,
  CalendarClock,
  Clock3,
  Film,
  Pencil,
  Plus,
} from "lucide-react";
import { MovieArt } from "@/components/ui/movie-art";
import { formatMovieBadge } from "@/lib/format";
import type { Movie } from "@/lib/movies";
import type { EditMovie, PatchMovie } from "@/components/admin/types";

type AdminScheduleProps = {
  movies: Movie[];
  edit: EditMovie;
  patch: PatchMovie;
};

export default function AdminSchedule({
  movies,
  edit,
  patch,
}: AdminScheduleProps) {
  const days = [
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "Chủ nhật",
    "Trọn bộ",
  ];
  return (
    <div className="schedule-admin">
      <div className="admin-summary-strip">
        <article>
          <CalendarClock />
          <span>
            Lịch trong tuần
            <strong>
              {
                movies.filter((movie: Movie) => movie.status === "Đang chiếu")
                  .length
              }{" "}
              phim
            </strong>
          </span>
        </article>
        <article>
          <Film />
          <span>
            Tập đã phát hành
            <strong>
              {movies.reduce(
                (sum: number, movie: Movie) => sum + movie.episode,
                0,
              )}{" "}
              tập
            </strong>
          </span>
        </article>
        <article>
          <Clock3 />
          <span>
            Sắp chiếu
            <strong>
              {
                movies.filter((movie: Movie) => movie.status === "Sắp chiếu")
                  .length
              }{" "}
              phim
            </strong>
          </span>
        </article>
      </div>
      <div className="schedule-board">
        {days.map((day) => {
          const dayMovies = movies
            .filter((movie: Movie) => movie.updateDay === day)
            .sort((a, b) => b.id - a.id);
          return (
            <section key={day}>
              <header>
                <div>
                  <b>{day}</b>
                  <span>{dayMovies.length} phim</span>
                </div>
                <CalendarDays />
              </header>
              <div>
                {dayMovies.map((movie: Movie) => (
                  <article key={movie.id}>
                    <MovieArt movie={movie} />
                    <div>
                      <b>{movie.title}</b>
                      <span>
                        {movie.totalEpisodes <= 1
                          ? "Bản Full (Trọn bộ)"
                          : formatMovieBadge(movie)}{" "}
                        · {movie.status}
                      </span>
                      <small>{movie.studio}</small>
                    </div>
                    <div className="schedule-actions">
                      {movie.totalEpisodes > 1 && (
                        <button
                          title="Tăng một tập"
                          disabled={movie.episode >= movie.totalEpisodes}
                          onClick={() =>
                            patch(movie.id, {
                              episode: Math.min(
                                movie.totalEpisodes,
                                movie.episode + 1,
                              ),
                              status:
                                movie.episode + 1 >= movie.totalEpisodes
                                  ? "Hoàn thành"
                                  : movie.status,
                            })
                          }
                        >
                          <Plus /> Phát tập mới
                        </button>
                      )}
                      <button title="Sửa lịch" onClick={() => edit(movie)}>
                        <Pencil />
                      </button>
                    </div>
                  </article>
                ))}
                {!dayMovies.length && (
                  <p className="schedule-empty">Chưa có phim được xếp lịch.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
