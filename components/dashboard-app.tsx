"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clapperboard,
  Clock3,
  Eye,
  Film,
  Heart,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Play,
  Plus,
  Search,
  Star,
  Sun,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { genres, movieSeed, type Movie } from "@/lib/movies";

type Account = { email: string; name: string; role: "admin" | "user" };
type HistoryItem = {
  movieId: number;
  episode: number;
  watchedAt: string;
  progress: number;
};
const storage = {
  movies: "viufilm3d-movies",
  favorites: "viufilm3d-favorites",
  history: "viufilm3d-history",
  user: "viufilm3d-user",
};
const read = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
const compact = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
const episodeLabel = (movie: Movie) =>
  movie.status === "Sắp chiếu"
    ? "Sắp chiếu"
    : `${movie.episode}/${movie.totalEpisodes}`;
const getId = (path: string) => Number(path.split("/").filter(Boolean).pop());

export default function DashboardApp() {
  const router = useRouter(),
    pathname = usePathname();
  const [movies, setMovies] = useState<Movie[]>(movieSeed),
    [favorites, setFavorites] = useState<number[]>([]),
    [history, setHistory] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<Account | null>(null),
    [ready, setReady] = useState(false),
    [query, setQuery] = useState(""),
    [genre, setGenre] = useState("Tất cả"),
    [mobile, setMobile] = useState(false),
    [toast, setToast] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => {
    const saved = read<Movie[]>(storage.movies, []);
    const catalog = saved.length ? saved : movieSeed;
    if (!saved.length) write(storage.movies, catalog);
    setMovies(catalog);
    setFavorites(read<number[]>(storage.favorites, []));
    setHistory(read<HistoryItem[]>(storage.history, []));
    setUser(read<Account | null>(storage.user, null));
    setReady(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const flash = (message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(""), 2200);
  };
  const go = (path: string) => {
    setMobile(false);
    router.push(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleFavorite = (id: number) => {
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    setFavorites(next);
    write(storage.favorites, next);
    flash(
      favorites.includes(id) ? "Đã bỏ khỏi yêu thích" : "Đã thêm vào yêu thích",
    );
  };
  const watch = (movie: Movie, episode = Math.max(1, movie.episode)) => {
    if (movie.status === "Sắp chiếu") {
      flash("Phim chưa phát hành");
      return;
    }
    const next = [
      {
        movieId: movie.id,
        episode,
        watchedAt: new Date().toISOString(),
        progress: 4,
      },
      ...history.filter((item) => item.movieId !== movie.id),
    ].slice(0, 30);
    setHistory(next);
    write(storage.history, next);
    go(`/xem/${movie.id}?tap=${episode}`);
  };
  const logout = () => {
    localStorage.removeItem(storage.user);
    setUser(null);
    go("/");
    flash("Đã đăng xuất");
  };
  const selected = movies.find((movie) => movie.id === getId(pathname));
  if (!ready)
    return (
      <div className="ha-loading">
        <Logo />
        <span />
      </div>
    );
  if (pathname === "/dang-nhap")
    return (
      <Login
        onLogin={(account: Account) => {
          setUser(account);
          write(storage.user, account);
          go(account.role === "admin" ? "/admin" : "/");
        }}
        close={() => go("/")}
      />
    );
  if (pathname.startsWith("/admin"))
    return user?.role === "admin" ? (
      <Admin
        movies={movies}
        setMovies={setMovies}
        logout={logout}
        pathname={pathname}
        go={go}
      />
    ) : (
      <Login
        onLogin={(account: Account) => {
          setUser(account);
          write(storage.user, account);
          go(account.role === "admin" ? "/admin" : "/");
        }}
        close={() => go("/")}
      />
    );
  return (
    <div className="cinema-app">
      {toast && (
        <div className="ha-toast">
          <Check size={16} />
          {toast}
        </div>
      )}
      <Header
        user={user}
        query={query}
        setQuery={setQuery}
        go={go}
        mobile={() => setMobile(true)}
        logout={logout}
      />
      {mobile && (
        <MobileNav
          user={user}
          go={go}
          close={() => setMobile(false)}
          logout={logout}
        />
      )}
      {pathname === "/" && (
        <Home
          movies={movies}
          go={go}
          watch={watch}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
      {pathname === "/phim" && (
        <Catalog
          movies={movies}
          query={query}
          setQuery={setQuery}
          genre={genre}
          setGenre={setGenre}
          go={go}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
      {pathname.startsWith("/phim/") &&
        (selected ? (
          <Detail
            movie={selected}
            go={go}
            watch={watch}
            favorite={favorites.includes(selected.id)}
            toggleFavorite={toggleFavorite}
          />
        ) : (
          <NotFound go={go} />
        ))}
      {pathname.startsWith("/xem/") &&
        (selected ? (
          <Watch movie={selected} movies={movies} go={go} onWatch={watch} />
        ) : (
          <NotFound go={go} />
        ))}
      {pathname === "/yeu-thich" && (
        <Library
          title="Phim yêu thích"
          eyebrow="BỘ SƯU TẬP CỦA BẠN"
          movies={movies.filter((movie) => favorites.includes(movie.id))}
          empty="Bạn chưa lưu bộ phim nào."
          go={go}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
      {pathname === "/lich-su" && (
        <HistoryPage
          movies={movies}
          history={history}
          setHistory={setHistory}
          go={go}
          watch={watch}
        />
      )}
      {pathname === "/tai-khoan" &&
        (user ? (
          <Profile user={user} setUser={setUser} go={go} logout={logout} />
        ) : (
          <Login
            onLogin={(account: Account) => {
              setUser(account);
              write(storage.user, account);
              go("/tai-khoan");
            }}
            close={() => go("/")}
          />
        ))}
      {!["/", "/phim", "/yeu-thich", "/lich-su", "/tai-khoan"].includes(
        pathname,
      ) &&
        !pathname.startsWith("/phim/") &&
        !pathname.startsWith("/xem/") && <NotFound go={go} />}
      <Footer go={go} />
    </div>
  );
}

function Logo() {
  return (
    <span className="ha-logo">
      <img src="/viufilm3d-logo.png" alt="Logo ViuFilm3D" />
      <span>
        <b>ViuFilm3D</b>
        <small>XEM PHIM TRỰC TUYẾN</small>
      </span>
    </span>
  );
}
function Header({ user, query, setQuery, go, mobile, logout }: any) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.mode = light ? "light" : "dark";
  }, [light]);
  return (
    <header className="ha-header">
      <div className="ha-container ha-header-inner">
        <button className="mobile-menu" onClick={mobile} aria-label="Mở menu">
          <Menu />
        </button>
        <button onClick={() => go("/")}>
          <Logo />
        </button>
        <div className="ha-search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && go("/phim")}
            placeholder="Nhập tên phim bạn muốn tìm kiếm…"
          />
          <button onClick={() => go("/phim")} aria-label="Tìm phim">
            <Search />
          </button>
        </div>
        <div className="ha-actions">
          <button
            onClick={() => setLight((value) => !value)}
            title="Đổi giao diện"
          >
            <Sun />
          </button>
          {user ? (
            <>
              <button
                className="user-link"
                onClick={() =>
                  go(user.role === "admin" ? "/admin" : "/tai-khoan")
                }
              >
                <User />
                <span>{user.name.split(" ")[0]}</span>
              </button>
              <button onClick={logout} title="Đăng xuất">
                <LogOut />
              </button>
            </>
          ) : (
            <button className="user-link" onClick={() => go("/dang-nhap")}>
              <User />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
      <nav className="ha-nav">
        <div className="ha-container ha-nav-inner">
          <button className="active" onClick={() => go("/")}>
            Phim mới
          </button>
          <button onClick={() => go("/phim")}>Thể loại⌄</button>
          <button onClick={() => go("/phim")}>Đang hot</button>
          <button onClick={() => go("/phim")}>Phim bộ</button>
          <button onClick={() => go("/phim")}>Phim lẻ</button>
          <button onClick={() => go("/phim")}>Hoàn thành</button>
          <button onClick={() => go("/phim")}>Miễn phí</button>
          <button onClick={() => go("/lich-su")}>Lịch sử</button>
        </div>
      </nav>
    </header>
  );
}
function MobileNav({ user, go, close, logout }: any) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  return (
    <div className="mobile-layer">
      <button className="mobile-backdrop" onClick={close} />
      <aside>
        <button className="mobile-close" onClick={close}>
          <X />
        </button>
        <Logo />
        <strong>Danh mục</strong>
        <button onClick={() => go("/")}>Phim mới</button>
        <button onClick={() => go("/phim")}>Đang hot</button>
        <button onClick={() => go("/phim")}>Phim bộ</button>
        <button onClick={() => go("/phim")}>Phim lẻ</button>
        <button onClick={() => go("/phim")}>Hoàn thành</button>
        <button onClick={() => go("/yeu-thich")}>Phim yêu thích</button>
        <button onClick={() => go("/lich-su")}>Lịch sử xem</button>
        {user ? (
          <>
            <button
              onClick={() =>
                go(user.role === "admin" ? "/admin" : "/tai-khoan")
              }
            >
              Tài khoản
            </button>
            <button onClick={logout}>Đăng xuất</button>
          </>
        ) : (
          <button onClick={() => go("/dang-nhap")}>Đăng nhập</button>
        )}
      </aside>
    </div>
  );
}

function MovieArt({
  movie,
  className = "",
}: {
  movie: Movie;
  className?: string;
}) {
  return (
    <div
      className={`movie-art ${className}`}
      style={
        {
          "--c1": movie.colors[0],
          "--c2": movie.colors[1],
        } as React.CSSProperties
      }
    >
      <div className="moon" />
      <div className="mountains" />
    </div>
  );
}
function Home({ movies, go, watch, favorites, toggleFavorite }: any) {
  const upcoming = movies
    .filter((movie: Movie) => movie.status === "Sắp chiếu")
    .slice(0, 6);
  const updated = movies
    .filter((movie: Movie) => movie.status === "Đang chiếu")
    .slice(0, 12);
  const hot = [...movies]
    .sort((a: Movie, b: Movie) => b.views - a.views)
    .slice(0, 8);
  const cultivation = movies
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
          movies={[...movies]
            .sort((a: Movie, b: Movie) => b.views - a.views)
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
function MovieShelf({
  title,
  movies,
  go,
  favorites,
  toggleFavorite,
  action,
}: any) {
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
function SectionTitle({ eyebrow, title, action }: any) {
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
function MovieCard({ movie, go, favorites, toggleFavorite }: any) {
  return (
    <article className="movie-card">
      <button className="poster-wrap" onClick={() => go(`/phim/${movie.id}`)}>
        <MovieArt movie={movie} />
        <span className="card-labels">
          <i>
            {movie.status === "Sắp chiếu"
              ? "Sắp chiếu"
              : `Phần ${movie.episode}`}
          </i>
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
function Ranking({ movies, go }: any) {
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
                <small>Phần {movie.episode}</small>
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

function Catalog({
  movies,
  query,
  setQuery,
  genre,
  setGenre,
  go,
  favorites,
  toggleFavorite,
}: any) {
  const [sort, setSort] = useState("new");
  const filtered = useMemo(() => {
    let list = movies.filter(
      (movie: Movie) =>
        (movie.title + " " + movie.originalTitle + " " + movie.genres.join(" "))
          .toLocaleLowerCase("vi")
          .includes(query.trim().toLocaleLowerCase("vi")) &&
        (genre === "Tất cả" || movie.genres.includes(genre)),
    );
    if (sort === "rating")
      list = [...list].sort((a: Movie, b: Movie) => b.rating - a.rating);
    if (sort === "views")
      list = [...list].sort((a: Movie, b: Movie) => b.views - a.views);
    if (sort === "year")
      list = [...list].sort((a: Movie, b: Movie) => b.year - a.year);
    return list;
  }, [movies, query, genre, sort]);
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>KHO PHIM VIUFILM3D</p>
        <h1>Khám phá thế giới hoạt hình 3D</h1>
        <span>{filtered.length} bộ phim trong thư viện</span>
      </div>
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tên phim, thể loại..."
          />
        </div>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="new">Mới cập nhật</option>
          <option value="rating">Đánh giá cao</option>
          <option value="views">Xem nhiều nhất</option>
          <option value="year">Năm phát hành</option>
        </select>
      </div>
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
        <Empty
          text="Không tìm thấy phim phù hợp."
          action="Xóa bộ lọc"
          onClick={() => {
            setQuery("");
            setGenre("Tất cả");
          }}
        />
      )}
    </main>
  );
}
function Detail({ movie, go, watch, favorite, toggleFavorite }: any) {
  return (
    <main>
      <section
        className="detail-hero"
        style={
          {
            "--hero1": movie.colors[0],
            "--hero2": movie.colors[1],
          } as React.CSSProperties
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
                <Clock3 /> {movie.duration} phút/tập
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
              <button
                className="primary-btn"
                onClick={() => watch(movie)}
                disabled={movie.status === "Sắp chiếu"}
              >
                <Play fill="currentColor" />{" "}
                {movie.status === "Sắp chiếu"
                  ? "Sắp phát hành"
                  : "Xem tập mới nhất"}
              </button>
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
          <SectionTitle eyebrow="DANH SÁCH PHÁT" title="Các tập phim" />
          <div className="episode-grid">
            {Array.from({ length: movie.episode }, (_, index) => index + 1)
              .reverse()
              .map((ep) => (
                <button key={ep} onClick={() => watch(movie, ep)}>
                  <Play size={14} /> Tập {ep}
                  {ep === movie.episode && <i>Mới</i>}
                </button>
              ))}
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
            <span>Số tập</span>
            <b>{movie.totalEpisodes} tập</b>
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
function Watch({ movie, movies, go, onWatch }: any) {
  const [episode, setEpisode] = useState(movie.episode);
  const related = movies
    .filter(
      (item: Movie) =>
        item.id !== movie.id &&
        item.genres.some((genre: string) => movie.genres.includes(genre)),
    )
    .slice(0, 5);
  const selectEpisode = (ep: number) => {
    setEpisode(ep);
    onWatch(movie, ep);
  };
  return (
    <main className="watch-page">
      <div className="watch-breadcrumb">
        <button onClick={() => go("/")}>Trang chủ</button>
        <ChevronRight />
        <button onClick={() => go(`/phim/${movie.id}`)}>{movie.title}</button>
        <ChevronRight />
        Tập {episode}
      </div>
      <section className="player-shell">
        <video
          controls
          preload="metadata"
          poster="/player-poster.svg"
          onPlay={() => onWatch(movie, episode)}
        >
          <source src={movie.video} type="video/mp4" />
          Trình duyệt không hỗ trợ video.
        </video>
        <div className="player-note">
          <Film />
          <span>
            <b>Video minh họa nội bộ</b>
            <small>
              Nội dung được tạo cho mục đích học tập, không sử dụng phim bên
              ngoài.
            </small>
          </span>
        </div>
      </section>
      <div className="watch-layout">
        <section>
          <p className="mini-label">ĐANG XEM</p>
          <h1>
            {movie.title} — Tập {episode}
          </h1>
          <p className="watch-desc">{movie.description}</p>
          <h3>Chọn tập</h3>
          <div className="episode-grid">
            {Array.from({ length: movie.episode }, (_, index) => index + 1)
              .reverse()
              .map((ep) => (
                <button
                  className={ep === episode ? "active" : ""}
                  key={ep}
                  onClick={() => selectEpisode(ep)}
                >
                  Tập {ep}
                </button>
              ))}
          </div>
        </section>
        <aside className="watch-next">
          <h3>Có thể bạn thích</h3>
          {related.map((item: Movie) => (
            <button key={item.id} onClick={() => go(`/phim/${item.id}`)}>
              <MovieArt movie={item} />
              <span>
                <b>{item.title}</b>
                <small>
                  {episodeLabel(item)} · {item.quality}
                </small>
              </span>
            </button>
          ))}
        </aside>
      </div>
    </main>
  );
}

function Library({
  title,
  eyebrow,
  movies,
  empty,
  go,
  favorites,
  toggleFavorite,
}: any) {
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
        <Empty
          text={empty}
          action="Khám phá kho phim"
          onClick={() => go("/phim")}
        />
      )}
    </main>
  );
}
function HistoryPage({ movies, history, setHistory, go, watch }: any) {
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
                    Đã xem tập {item.episode} ·{" "}
                    {new Date(item.watchedAt).toLocaleDateString("vi-VN")}
                  </span>
                  <div className="progress">
                    <i style={{ width: `${item.progress}%` }} />
                  </div>
                  <button
                    className="primary-btn"
                    onClick={() => watch(movie, item.episode)}
                  >
                    <Play fill="currentColor" /> Xem tiếp
                  </button>
                </div>
              </article>
            ) : null;
          })}
        </div>
      ) : (
        <Empty
          text="Bạn chưa xem bộ phim nào."
          action="Xem phim ngay"
          onClick={() => go("/phim")}
        />
      )}
    </main>
  );
}
function Empty({ text, action, onClick }: any) {
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
function NotFound({ go }: any) {
  return (
    <main className="page-shell">
      <Empty
        text="Trang hoặc bộ phim này không tồn tại."
        action="Về trang chủ"
        onClick={() => go("/")}
      />
    </main>
  );
}

function Login({ onLogin, close }: any) {
  const [email, setEmail] = useState("user@gmail.com"),
    [password, setPassword] = useState("123456"),
    [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const accounts: Record<string, Account> = {
      "user@gmail.com": {
        email: "user@gmail.com",
        name: "Minh Anh",
        role: "user",
      },
      "admin@gmail.com": {
        email: "admin@gmail.com",
        name: "Quản trị viên",
        role: "admin",
      },
    };
    const account = accounts[email.trim().toLowerCase()];
    if (!account || password !== "123456") {
      setError("Email hoặc mật khẩu không chính xác.");
      return;
    }
    onLogin(account);
  };
  return (
    <main className="login-page">
      <section className="login-art">
        <Logo />
        <div>
          <p className="mini-label">THẾ GIỚI HOẠT HÌNH 3D</p>
          <h1>
            Mỗi khung hình,
            <br />
            <em>một thế giới mới.</em>
          </h1>
          <span>
            Thư viện phim nguyên bản và nội dung minh họa được lưu trực tiếp
            trong hệ thống.
          </span>
        </div>
      </section>
      <form onSubmit={submit}>
        <button type="button" className="login-close" onClick={close}>
          <X />
        </button>
        <p className="mini-label">TÀI KHOẢN VIUFILM3D</p>
        <h2>Chào mừng trở lại</h2>
        <span>Đăng nhập để đồng bộ danh sách phim của bạn.</span>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-btn full">Đăng nhập</button>
        <small>
          Tài khoản xem: user@gmail.com · Quản trị: admin@gmail.com
          <br />
          Mật khẩu: 123456
        </small>
      </form>
    </main>
  );
}
function Profile({ user, setUser, go, logout }: any) {
  const [name, setName] = useState(user.name),
    [saved, setSaved] = useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = { ...user, name: name.trim() };
    setUser(next);
    write(storage.user, next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <main className="page-shell profile">
      <div className="page-heading">
        <p>KHÔNG GIAN CỦA BẠN</p>
        <h1>Hồ sơ người xem</h1>
      </div>
      <div className="profile-banner">
        <div>
          {name
            .split(" ")
            .map((part: string) => part[0])
            .slice(-2)
            .join("")
            .toUpperCase()}
        </div>
        <h2>{name}</h2>
        <span>{user.email}</span>
      </div>
      <form onSubmit={submit}>
        <label>
          Tên hiển thị
          <input
            value={name}
            minLength={2}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Email
          <input value={user.email} disabled />
        </label>
        <button className="primary-btn">
          {saved ? "Đã lưu" : "Lưu thay đổi"}
        </button>
      </form>
      <div className="profile-links">
        <button onClick={() => go("/yeu-thich")}>
          <Heart /> Phim yêu thích
        </button>
        <button onClick={() => go("/lich-su")}>
          <History /> Lịch sử xem
        </button>
        <button onClick={logout}>
          <LogOut /> Đăng xuất
        </button>
      </div>
    </main>
  );
}

function Admin({ movies, setMovies, logout, pathname, go }: any) {
  const section = pathname === "/admin/phim" ? "movies" : "dashboard";
  const [editing, setEditing] = useState<Movie | null | undefined>(undefined);
  const save = (movie: Movie) => {
    const next = movies.some((item: Movie) => item.id === movie.id)
      ? movies.map((item: Movie) => (item.id === movie.id ? movie : item))
      : [movie, ...movies];
    setMovies(next);
    write(storage.movies, next);
    setEditing(undefined);
  };
  const remove = (id: number) => {
    if (!confirm("Xóa phim này khỏi thư viện?")) return;
    const next = movies.filter((item: Movie) => item.id !== id);
    setMovies(next);
    write(storage.movies, next);
  };
  return (
    <div className="admin-layout">
      <aside>
        <Logo />
        <p>QUẢN TRỊ</p>
        <button
          className={section === "dashboard" ? "active" : ""}
          onClick={() => go("/admin")}
        >
          <LayoutDashboard /> Tổng quan
        </button>
        <button
          className={section === "movies" ? "active" : ""}
          onClick={() => go("/admin/phim")}
        >
          <Clapperboard /> Kho phim
        </button>
        <button>
          <Users /> Người dùng
        </button>
        <button className="admin-logout" onClick={logout}>
          <LogOut /> Đăng xuất
        </button>
      </aside>
      <main>
        <header>
          <div>
            <p className="mini-label">VIUFILM3D STUDIO</p>
            <h1>
              {section === "dashboard" ? "Tổng quan hệ thống" : "Quản lý phim"}
            </h1>
          </div>
          <span className="admin-avatar">QT</span>
        </header>
        {section === "dashboard" ? (
          <AdminDashboard movies={movies} />
        ) : (
          <AdminMovies movies={movies} edit={setEditing} remove={remove} />
        )}
      </main>
      {editing !== undefined && (
        <MovieForm
          movie={editing}
          close={() => setEditing(undefined)}
          save={save}
        />
      )}{" "}
      {section === "movies" && (
        <button className="admin-fab" onClick={() => setEditing(null)}>
          <Plus /> Thêm phim
        </button>
      )}
    </div>
  );
}
function AdminDashboard({ movies }: any) {
  const totalViews = movies.reduce(
    (sum: number, movie: Movie) => sum + movie.views,
    0,
  );
  return (
    <>
      <div className="admin-stats">
        <div>
          <Film />
          <span>Tổng phim</span>
          <strong>{movies.length}</strong>
          <small>Thư viện nội bộ</small>
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
          <strong>
            {(
              movies.reduce(
                (sum: number, movie: Movie) => sum + movie.rating,
                0,
              ) / movies.length
            ).toFixed(1)}
          </strong>
          <small>Trên thang 10</small>
        </div>
        <div>
          <CalendarDays />
          <span>Đang chiếu</span>
          <strong>
            {
              movies.filter((movie: Movie) => movie.status === "Đang chiếu")
                .length
            }
          </strong>
          <small>Cập nhật mỗi tuần</small>
        </div>
      </div>
      <div className="admin-panels">
        <section>
          <h2>Phim xem nhiều nhất</h2>
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
          <h2>Lịch cập nhật</h2>
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
    </>
  );
}
function AdminMovies({ movies, edit, remove }: any) {
  const [keyword, setKeyword] = useState("");
  const list = movies.filter((movie: Movie) =>
    movie.title.toLowerCase().includes(keyword.toLowerCase()),
  );
  return (
    <section className="admin-table-wrap">
      <div className="admin-toolbar">
        <div className="catalog-search">
          <Search />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm tên phim..."
          />
        </div>
        <span>{list.length} phim</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Phim</th>
            <th>Tiến độ</th>
            <th>Trạng thái</th>
            <th>Lượt xem</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((movie: Movie) => (
            <tr key={movie.id}>
              <td>
                <MovieArt movie={movie} />
                <span>
                  <b>{movie.title}</b>
                  <small>{movie.genres.join(" · ")}</small>
                </span>
              </td>
              <td>
                {movie.episode}/{movie.totalEpisodes}
              </td>
              <td>
                <i className="status-pill">{movie.status}</i>
              </td>
              <td>{compact(movie.views)}</td>
              <td>
                <button onClick={() => edit(movie)}>
                  <Pencil />
                </button>
                <button onClick={() => remove(movie.id)}>
                  <Trash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
function MovieForm({ movie, close, save }: any) {
  const [form, setForm] = useState<Movie>(
    movie || {
      ...movieSeed[0],
      id: Date.now(),
      title: "",
      originalTitle: "",
      episode: 0,
      totalEpisodes: 24,
      views: 0,
      rating: 8.5,
      featured: false,
    },
  );
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    save({
      ...form,
      title: form.title.trim(),
      originalTitle: form.originalTitle.trim(),
      description: form.description.trim(),
    });
  };
  return (
    <div className="modal-layer">
      <form className="movie-form" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          <X />
        </button>
        <p className="mini-label">THƯ VIỆN NỘI BỘ</p>
        <h2>{movie ? "Chỉnh sửa phim" : "Thêm phim mới"}</h2>
        <label>
          Tên phim
          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
          />
        </label>
        <label>
          Tên quốc tế
          <input
            required
            value={form.originalTitle}
            onChange={(event) =>
              setForm({ ...form, originalTitle: event.target.value })
            }
          />
        </label>
        <div className="form-two">
          <label>
            Tập hiện tại
            <input
              type="number"
              min="0"
              max={form.totalEpisodes}
              value={form.episode}
              onChange={(event) =>
                setForm({ ...form, episode: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Tổng số tập
            <input
              type="number"
              min="1"
              value={form.totalEpisodes}
              onChange={(event) =>
                setForm({ ...form, totalEpisodes: Number(event.target.value) })
              }
            />
          </label>
        </div>
        <div className="form-two">
          <label>
            Trạng thái
            <select
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as Movie["status"],
                })
              }
            >
              <option>Đang chiếu</option>
              <option>Hoàn thành</option>
              <option>Sắp chiếu</option>
            </select>
          </label>
          <label>
            Lịch cập nhật
            <select
              value={form.updateDay}
              onChange={(event) =>
                setForm({ ...form, updateDay: event.target.value })
              }
            >
              {[
                "Thứ 2",
                "Thứ 3",
                "Thứ 4",
                "Thứ 5",
                "Thứ 6",
                "Thứ 7",
                "Chủ nhật",
              ].map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Mô tả
          <textarea
            required
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </label>
        <button className="primary-btn full">Lưu phim</button>
      </form>
    </div>
  );
}
function Footer({ go }: any) {
  return (
    <footer className="ha-footer">
      <div>
        <Logo />
        <p>Nền tảng xem hoạt hình 3D với thư viện nội dung nguyên bản.</p>
      </div>
      <div>
        <b>Khám phá</b>
        <button onClick={() => go("/phim")}>Kho phim</button>
        <button onClick={() => go("/lich-su")}>Lịch sử xem</button>
      </div>
      <div>
        <b>Thể loại</b>
        <span>Tiên hiệp · Huyền huyễn</span>
        <span>Kiếm hiệp · Xuyên không</span>
      </div>
      <div>
        <b>Thông tin</b>
        <span>Nội dung nguyên bản</span>
        <span>Dữ liệu lưu cục bộ</span>
      </div>
    </footer>
  );
}
