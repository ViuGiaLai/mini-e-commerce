"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarClock,
  Check,
  ChevronRight,
  Clapperboard,
  Clock3,
  Copy,
  Database,
  Eye,
  Film,
  Filter,
  Heart,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Pencil,
  Play,
  Plus,
  Search,
  Save,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
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
type Viewer = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "Đang hoạt động" | "Đã khóa";
  plan: "Miễn phí" | "VIP";
  joinedAt: string;
  lastActive: string;
  watches: number;
};
type SiteSettings = {
  siteName: string;
  tagline: string;
  supportEmail: string;
  maintenance: boolean;
  allowRegistration: boolean;
  showViewCount: boolean;
  itemsPerPage: number;
};
type ThemeMode = "dark" | "light";
const storage = {
  movies: "viufilm3d-movies",
  favorites: "viufilm3d-favorites",
  history: "viufilm3d-history",
  user: "viufilm3d-user",
  viewers: "viufilm3d-viewers",
  settings: "viufilm3d-settings",
  theme: "viufilm3d-theme",
};
const viewerSeed: Viewer[] = [
  {
    id: 1,
    name: "Quản trị viên",
    email: "admin@gmail.com",
    role: "admin",
    status: "Đang hoạt động",
    plan: "VIP",
    joinedAt: "2026-01-05",
    lastActive: "2026-09-26T08:30:00.000Z",
    watches: 186,
  },
  {
    id: 2,
    name: "Minh Anh",
    email: "user@gmail.com",
    role: "user",
    status: "Đang hoạt động",
    plan: "VIP",
    joinedAt: "2026-02-12",
    lastActive: "2026-09-26T07:20:00.000Z",
    watches: 94,
  },
  ...[
    ["Hoàng Nam", "nam.hoang@gmail.com", "Miễn phí", 71],
    ["Bảo Ngọc", "bao.ngoc@gmail.com", "VIP", 128],
    ["Tuấn Kiệt", "tuan.kiet@gmail.com", "Miễn phí", 43],
    ["Thảo Vy", "thao.vy@gmail.com", "VIP", 109],
    ["Gia Huy", "gia.huy@gmail.com", "Miễn phí", 22],
    ["Khánh Linh", "khanh.linh@gmail.com", "VIP", 87],
  ].map(([name, email, plan, watches], index) => ({
    id: index + 3,
    name: String(name),
    email: String(email),
    role: "user" as const,
    status: "Đang hoạt động" as const,
    plan: plan as Viewer["plan"],
    joinedAt: `2026-0${(index % 6) + 3}-${String(index + 10).padStart(2, "0")}`,
    lastActive: new Date(Date.now() - index * 86400000).toISOString(),
    watches: Number(watches),
  })),
];
const defaultSettings: SiteSettings = {
  siteName: "ViuFilm3D",
  tagline: "Thế giới hoạt hình 3D nguyên bản",
  supportEmail: "support@viufilm3d.local",
  maintenance: false,
  allowRegistration: true,
  showViewCount: true,
  itemsPerPage: 20,
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
const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function DashboardApp() {
  const router = useRouter(),
    pathname = usePathname();
  const [movies, setMovies] = useState<Movie[]>(movieSeed),
    [favorites, setFavorites] = useState<number[]>([]),
    [history, setHistory] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<Account | null>(null),
    [ready, setReady] = useState(false),
    [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings),
    [theme, setTheme] = useState<ThemeMode>("dark"),
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
    setSiteSettings({
      ...defaultSettings,
      ...read<SiteSettings>(storage.settings, defaultSettings),
    });
    const savedTheme = localStorage.getItem(storage.theme);
    const initialTheme: ThemeMode =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    setTheme(initialTheme);
    document.documentElement.dataset.mode = initialTheme;
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
  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(storage.theme, next);
      document.documentElement.dataset.mode = next;
      return next;
    });
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
        settings={siteSettings}
        setSettings={setSiteSettings}
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
        theme={theme}
        toggleTheme={toggleTheme}
      />
      {siteSettings.maintenance && (
        <div className="maintenance-banner">
          <Settings /> Hệ thống đang ở chế độ bảo trì. Một số nội dung có thể
          được cập nhật trong thời gian này.
        </div>
      )}
      {mobile && (
        <MobileNav
          user={user}
          go={go}
          close={() => setMobile(false)}
          logout={logout}
          theme={theme}
          toggleTheme={toggleTheme}
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
function Header({
  user,
  query,
  setQuery,
  go,
  mobile,
  logout,
  theme,
  toggleTheme,
}: any) {
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
            onClick={toggleTheme}
            title={
              theme === "dark"
                ? "Chuyển sang chế độ sáng"
                : "Chuyển sang chế độ tối"
            }
            aria-label={
              theme === "dark"
                ? "Chuyển sang chế độ sáng"
                : "Chuyển sang chế độ tối"
            }
          >
            {theme === "dark" ? <Sun /> : <Moon />}
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
function MobileNav({ user, go, close, logout, theme, toggleTheme }: any) {
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
        <button onClick={toggleTheme}>
          {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
        </button>
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
    const viewers = read<Viewer[]>(storage.viewers, viewerSeed);
    const viewer = viewers.find(
      (item) => item.email === email.trim().toLowerCase(),
    );
    if (!viewer || password !== "123456") {
      setError("Email hoặc mật khẩu không chính xác.");
      return;
    }
    if (viewer.status === "Đã khóa") {
      setError("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
      return;
    }
    onLogin({ email: viewer.email, name: viewer.name, role: viewer.role });
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

function Admin({
  movies,
  setMovies,
  logout,
  pathname,
  go,
  settings,
  setSettings,
}: any) {
  const section = pathname.includes("/admin/phim")
    ? "movies"
    : pathname.includes("/admin/lich-chieu")
      ? "schedule"
      : pathname.includes("/admin/nguoi-dung")
        ? "users"
        : pathname.includes("/admin/cai-dat")
          ? "settings"
          : "dashboard";
  const [editing, setEditing] = useState<Movie | null | undefined>(undefined);
  const [editingViewer, setEditingViewer] = useState<Viewer | null | undefined>(
    undefined,
  );
  const [viewers, setViewers] = useState<Viewer[]>(viewerSeed);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const savedViewers = read<Viewer[]>(storage.viewers, viewerSeed);
    setViewers(savedViewers);
    if (!localStorage.getItem(storage.viewers)) {
      write(storage.viewers, savedViewers);
    }
  }, []);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };
  const save = (movie: Movie) => {
    const normalized = {
      ...movie,
      slug: movie.slug || toSlug(movie.title),
      episode: Math.min(movie.episode, movie.totalEpisodes),
    };
    const next = movies.some((item: Movie) => item.id === movie.id)
      ? movies.map((item: Movie) => (item.id === movie.id ? normalized : item))
      : [normalized, ...movies];
    setMovies(next);
    write(storage.movies, next);
    setEditing(undefined);
    notify(movie.title ? `Đã lưu “${movie.title}”` : "Đã lưu phim");
  };
  const remove = (id: number) => {
    if (!confirm("Xóa phim này khỏi thư viện?")) return;
    const next = movies.filter((item: Movie) => item.id !== id);
    setMovies(next);
    write(storage.movies, next);
    notify("Đã xóa phim khỏi thư viện");
  };
  const removeMany = (ids: number[]) => {
    if (!ids.length || !confirm(`Xóa ${ids.length} phim đã chọn?`)) return;
    const next = movies.filter((item: Movie) => !ids.includes(item.id));
    setMovies(next);
    write(storage.movies, next);
    notify(`Đã xóa ${ids.length} phim`);
  };
  const duplicateMovie = (movie: Movie) => {
    const duplicate = {
      ...movie,
      id: Date.now(),
      title: `${movie.title} — Bản sao`,
      slug: `${movie.slug}-ban-sao-${Date.now()}`,
      featured: false,
      views: 0,
    };
    const next = [duplicate, ...movies];
    setMovies(next);
    write(storage.movies, next);
    notify("Đã nhân bản phim");
  };
  const patchMovie = (id: number, changes: Partial<Movie>) => {
    const next = movies.map((movie: Movie) =>
      movie.id === id ? { ...movie, ...changes } : movie,
    );
    setMovies(next);
    write(storage.movies, next);
    notify("Đã cập nhật phim");
  };
  const saveViewer = (viewer: Viewer) => {
    const normalized =
      viewer.id === 1
        ? {
            ...viewer,
            email: "admin@gmail.com",
            role: "admin" as const,
            status: "Đang hoạt động" as const,
          }
        : viewer;
    const duplicateEmail = viewers.some(
      (item) => item.email === normalized.email && item.id !== normalized.id,
    );
    if (duplicateEmail) {
      notify("Email đã tồn tại trong hệ thống");
      return;
    }
    const next = viewers.some((item) => item.id === normalized.id)
      ? viewers.map((item) => (item.id === normalized.id ? normalized : item))
      : [normalized, ...viewers];
    setViewers(next);
    write(storage.viewers, next);
    setEditingViewer(undefined);
    notify("Đã lưu tài khoản");
  };
  const patchViewer = (id: number, changes: Partial<Viewer>) => {
    const next = viewers.map((viewer) =>
      viewer.id === id ? { ...viewer, ...changes } : viewer,
    );
    setViewers(next);
    write(storage.viewers, next);
    notify("Đã cập nhật tài khoản");
  };
  const removeViewer = (id: number) => {
    const target = viewers.find((viewer) => viewer.id === id);
    if (!target || target.role === "admin") {
      notify("Không thể xóa tài khoản quản trị chính");
      return;
    }
    if (!confirm(`Xóa tài khoản ${target.email}?`)) return;
    const next = viewers.filter((viewer) => viewer.id !== id);
    setViewers(next);
    write(storage.viewers, next);
    notify("Đã xóa tài khoản");
  };
  const saveSettings = (next: SiteSettings) => {
    setSettings(next);
    write(storage.settings, next);
    notify("Đã lưu cấu hình hệ thống");
  };
  const sectionTitle: Record<string, string> = {
    dashboard: "Tổng quan hệ thống",
    movies: "Quản lý kho phim",
    schedule: "Lịch phát hành",
    users: "Quản lý người dùng",
    settings: "Cấu hình hệ thống",
  };
  return (
    <div className="admin-layout">
      {notice && (
        <div className="admin-notice">
          <Check />
          {notice}
        </div>
      )}
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
        <button
          className={section === "schedule" ? "active" : ""}
          onClick={() => go("/admin/lich-chieu")}
        >
          <CalendarClock /> Lịch chiếu
        </button>
        <button
          className={section === "users" ? "active" : ""}
          onClick={() => go("/admin/nguoi-dung")}
        >
          <Users /> Người dùng
        </button>
        <button
          className={section === "settings" ? "active" : ""}
          onClick={() => go("/admin/cai-dat")}
        >
          <Settings /> Cài đặt
        </button>
        <button onClick={() => go("/")}>
          <Eye /> Xem website
        </button>
        <button className="admin-logout" onClick={logout}>
          <LogOut /> Đăng xuất
        </button>
      </aside>
      <main>
        <header>
          <div>
            <p className="mini-label">VIUFILM3D STUDIO</p>
            <h1>{sectionTitle[section]}</h1>
          </div>
          <div className="admin-profile">
            <span>
              Quản trị viên<small>Toàn quyền hệ thống</small>
            </span>
            <i className="admin-avatar">QT</i>
          </div>
        </header>
        {section === "dashboard" && (
          <AdminDashboard movies={movies} viewers={viewers} go={go} />
        )}
        {section === "movies" && (
          <AdminMovies
            movies={movies}
            edit={setEditing}
            remove={remove}
            removeMany={removeMany}
            duplicate={duplicateMovie}
            patchMovie={patchMovie}
            pageSize={settings.itemsPerPage}
          />
        )}
        {section === "schedule" && (
          <AdminSchedule movies={movies} edit={setEditing} patch={patchMovie} />
        )}
        {section === "users" && (
          <AdminUsers
            viewers={viewers}
            edit={setEditingViewer}
            patch={patchViewer}
            remove={removeViewer}
          />
        )}
        {section === "settings" && (
          <AdminSettings settings={settings} save={saveSettings} />
        )}
      </main>
      {editing !== undefined && (
        <MovieForm
          movie={editing}
          close={() => setEditing(undefined)}
          save={save}
        />
      )}{" "}
      {editingViewer !== undefined && (
        <ViewerForm
          viewer={editingViewer}
          close={() => setEditingViewer(undefined)}
          save={saveViewer}
        />
      )}
      {section === "movies" && (
        <button className="admin-fab" onClick={() => setEditing(null)}>
          <Plus /> Thêm phim
        </button>
      )}
      {section === "users" && (
        <button className="admin-fab" onClick={() => setEditingViewer(null)}>
          <UserPlus /> Thêm người dùng
        </button>
      )}
    </div>
  );
}
function AdminDashboard({ movies, viewers, go }: any) {
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
                    {movie.status} · Tập {movie.episode}/{movie.totalEpisodes}
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
function AdminMovies({
  movies,
  edit,
  remove,
  removeMany,
  duplicate,
  patchMovie,
  pageSize,
}: any) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const [genre, setGenre] = useState("Tất cả");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const filteredList = movies
    .filter((movie: Movie) => {
      const target =
        `${movie.title} ${movie.originalTitle} ${movie.studio}`.toLowerCase();
      return (
        target.includes(keyword.trim().toLowerCase()) &&
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
  useEffect(() => setPage(1), [keyword, status, genre, sort, pageSize]);
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
          <label>
            <Filter />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>Tất cả</option>
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
                    {movie.duration} phút/tập
                  </small>
                </td>
                <td>
                  <b>
                    {movie.episode}/{movie.totalEpisodes}
                  </b>
                  <div className="table-progress">
                    <i
                      style={{
                        width: `${(movie.episode / movie.totalEpisodes) * 100}%`,
                      }}
                    />
                  </div>
                </td>
                <td>
                  <b>{movie.updateDay}</b>
                  <small>
                    {movie.status === "Đang chiếu"
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
function AdminSchedule({ movies, edit, patch }: any) {
  const days = [
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "Chủ nhật",
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
          const dayMovies = movies.filter(
            (movie: Movie) => movie.updateDay === day,
          );
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
                        Tập {movie.episode}/{movie.totalEpisodes} ·{" "}
                        {movie.status}
                      </span>
                      <small>{movie.studio}</small>
                    </div>
                    <div className="schedule-actions">
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

function AdminUsers({ viewers, edit, patch, remove }: any) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const list = viewers.filter((viewer: Viewer) => {
    const matched = `${viewer.name} ${viewer.email}`
      .toLowerCase()
      .includes(keyword.toLowerCase());
    return (
      matched &&
      (status === "Tất cả" ||
        viewer.status === status ||
        viewer.plan === status)
    );
  });
  return (
    <section className="admin-users">
      <div className="admin-summary-strip">
        <article>
          <Users />
          <span>
            Tổng tài khoản<strong>{viewers.length}</strong>
          </span>
        </article>
        <article>
          <UserCheck />
          <span>
            Đang hoạt động
            <strong>
              {
                viewers.filter(
                  (viewer: Viewer) => viewer.status === "Đang hoạt động",
                ).length
              }
            </strong>
          </span>
        </article>
        <article>
          <Star />
          <span>
            Thành viên VIP
            <strong>
              {viewers.filter((viewer: Viewer) => viewer.plan === "VIP").length}
            </strong>
          </span>
        </article>
      </div>
      <div className="admin-toolbar user-toolbar">
        <div className="catalog-search">
          <Search />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm tên hoặc email..."
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option>Tất cả</option>
          <option>Đang hoạt động</option>
          <option>Đã khóa</option>
          <option>VIP</option>
          <option>Miễn phí</option>
        </select>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Gói</th>
              <th>Trạng thái</th>
              <th>Ngày tham gia</th>
              <th>Hoạt động</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((viewer: Viewer) => (
              <tr key={viewer.id}>
                <td>
                  <i className="user-initial">
                    {viewer.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(-2)
                      .join("")}
                  </i>
                  <span>
                    <b>{viewer.name}</b>
                    <small>{viewer.email}</small>
                  </span>
                </td>
                <td>
                  <span className="role-badge">
                    <ShieldCheck />
                    {viewer.role === "admin" ? "Quản trị" : "Người xem"}
                  </span>
                </td>
                <td>
                  <button
                    className={`plan-badge ${viewer.plan === "VIP" ? "vip" : ""}`}
                    onClick={() =>
                      patch(viewer.id, {
                        plan: viewer.plan === "VIP" ? "Miễn phí" : "VIP",
                      })
                    }
                  >
                    {viewer.plan}
                  </button>
                </td>
                <td>
                  <button
                    className={`account-status ${viewer.status === "Đã khóa" ? "blocked" : ""}`}
                    disabled={viewer.role === "admin"}
                    onClick={() =>
                      patch(viewer.id, {
                        status:
                          viewer.status === "Đang hoạt động"
                            ? "Đã khóa"
                            : "Đang hoạt động",
                      })
                    }
                  >
                    <i />
                    {viewer.status}
                  </button>
                </td>
                <td>{new Date(viewer.joinedAt).toLocaleDateString("vi-VN")}</td>
                <td>
                  <b>{viewer.watches} lượt xem</b>
                  <small>
                    {new Date(viewer.lastActive).toLocaleDateString("vi-VN")}
                  </small>
                </td>
                <td>
                  <button onClick={() => edit(viewer)}>
                    <Pencil />
                  </button>
                  <button
                    className="delete-icon"
                    onClick={() => remove(viewer.id)}
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
            <Users />
            <b>Không có tài khoản phù hợp</b>
            <span>Thử thay đổi bộ lọc tìm kiếm.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function AdminSettings({
  settings,
  save,
}: {
  settings: SiteSettings;
  save: (settings: SiteSettings) => void;
}) {
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    save(form);
  };
  return (
    <form className="admin-settings" onSubmit={submit}>
      <section>
        <div className="settings-heading">
          <Settings />
          <div>
            <h2>Thông tin website</h2>
            <p>Tên và thông tin hiển thị chung của hệ thống.</p>
          </div>
        </div>
        <div className="settings-grid">
          <label>
            Tên website
            <input
              required
              value={form.siteName}
              onChange={(event) =>
                setForm({ ...form, siteName: event.target.value })
              }
            />
          </label>
          <label>
            Email hỗ trợ
            <input
              required
              type="email"
              value={form.supportEmail}
              onChange={(event) =>
                setForm({ ...form, supportEmail: event.target.value })
              }
            />
          </label>
          <label className="span-two">
            Khẩu hiệu
            <input
              required
              value={form.tagline}
              onChange={(event) =>
                setForm({ ...form, tagline: event.target.value })
              }
            />
          </label>
        </div>
      </section>
      <section>
        <div className="settings-heading">
          <ShieldCheck />
          <div>
            <h2>Quyền truy cập</h2>
            <p>Kiểm soát đăng ký và trạng thái vận hành.</p>
          </div>
        </div>
        <label className="setting-toggle">
          <span>
            <b>Cho phép đăng ký tài khoản</b>
            <small>Người xem mới có thể tạo tài khoản.</small>
          </span>
          <input
            type="checkbox"
            checked={form.allowRegistration}
            onChange={(event) =>
              setForm({ ...form, allowRegistration: event.target.checked })
            }
          />
        </label>
        <label className="setting-toggle">
          <span>
            <b>Hiển thị lượt xem công khai</b>
            <small>Hiện thống kê lượt xem trên trang phim.</small>
          </span>
          <input
            type="checkbox"
            checked={form.showViewCount}
            onChange={(event) =>
              setForm({ ...form, showViewCount: event.target.checked })
            }
          />
        </label>
        <label className="setting-toggle warning">
          <span>
            <b>Chế độ bảo trì</b>
            <small>Đánh dấu hệ thống đang trong thời gian bảo trì.</small>
          </span>
          <input
            type="checkbox"
            checked={form.maintenance}
            onChange={(event) =>
              setForm({ ...form, maintenance: event.target.checked })
            }
          />
        </label>
      </section>
      <section>
        <div className="settings-heading">
          <Database />
          <div>
            <h2>Hiển thị dữ liệu</h2>
            <p>Cấu hình số lượng nội dung trong trang quản trị.</p>
          </div>
        </div>
        <label>
          Số phim mỗi trang
          <select
            value={form.itemsPerPage}
            onChange={(event) =>
              setForm({ ...form, itemsPerPage: Number(event.target.value) })
            }
          >
            <option value={10}>10 phim</option>
            <option value={20}>20 phim</option>
            <option value={30}>30 phim</option>
            <option value={50}>50 phim</option>
          </select>
        </label>
      </section>
      <div className="settings-save">
        <span>Mọi thay đổi được lưu trong trình duyệt hiện tại.</span>
        <button className="primary-btn">
          <Save /> Lưu cấu hình
        </button>
      </div>
    </form>
  );
}

function ViewerForm({ viewer, close, save }: any) {
  const [form, setForm] = useState<Viewer>(
    viewer || {
      id: Date.now(),
      name: "",
      email: "",
      role: "user",
      status: "Đang hoạt động",
      plan: "Miễn phí",
      joinedAt: new Date().toISOString().slice(0, 10),
      lastActive: new Date().toISOString(),
      watches: 0,
    },
  );
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    save({
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
    });
  };
  return (
    <div className="modal-layer">
      <form className="movie-form viewer-form" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          <X />
        </button>
        <p className="mini-label">QUẢN LÝ NGƯỜI DÙNG</p>
        <h2>{viewer ? "Chỉnh sửa tài khoản" : "Thêm người dùng"}</h2>
        <label>
          Họ và tên
          <input
            required
            minLength={2}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            disabled={viewer?.id === 1}
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
          />
        </label>
        <div className="form-two">
          <label>
            Vai trò
            <select
              disabled={viewer?.id === 1}
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value as Viewer["role"] })
              }
            >
              <option value="user">Người xem</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </label>
          <label>
            Gói tài khoản
            <select
              value={form.plan}
              onChange={(event) =>
                setForm({ ...form, plan: event.target.value as Viewer["plan"] })
              }
            >
              <option>Miễn phí</option>
              <option>VIP</option>
            </select>
          </label>
        </div>
        <label>
          Trạng thái
          <select
            disabled={viewer?.id === 1}
            value={form.status}
            onChange={(event) =>
              setForm({
                ...form,
                status: event.target.value as Viewer["status"],
              })
            }
          >
            <option>Đang hoạt động</option>
            <option>Đã khóa</option>
          </select>
        </label>
        <p className="form-hint">
          Mật khẩu mặc định của dữ liệu mẫu là <b>123456</b>.
        </p>
        <button className="primary-btn full">
          <Save /> Lưu tài khoản
        </button>
      </form>
    </div>
  );
}

function MovieForm({ movie, close, save }: any) {
  const [form, setForm] = useState<Movie>(
    movie || {
      ...movieSeed[0],
      id: Date.now(),
      slug: "",
      title: "",
      originalTitle: "",
      episode: 0,
      totalEpisodes: 24,
      views: 0,
      rating: 8.5,
      featured: false,
    },
  );
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.episode > form.totalEpisodes) {
      setError("Tập hiện tại không thể lớn hơn tổng số tập.");
      return;
    }
    if (!form.genres.length) {
      setError("Hãy chọn ít nhất một thể loại.");
      return;
    }
    save({
      ...form,
      slug: form.slug.trim() || toSlug(form.title),
      title: form.title.trim(),
      originalTitle: form.originalTitle.trim(),
      description: form.description.trim(),
    });
  };
  const toggleGenre = (genre: string) => {
    setForm({
      ...form,
      genres: form.genres.includes(genre)
        ? form.genres.filter((item) => item !== genre)
        : [...form.genres, genre],
    });
  };
  return (
    <div className="modal-layer">
      <form className="movie-form movie-form-wide" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          <X />
        </button>
        <p className="mini-label">THƯ VIỆN NỘI BỘ</p>
        <h2>{movie ? "Chỉnh sửa phim" : "Thêm phim mới"}</h2>
        {error && <p className="form-error">{error}</p>}
        <div className="form-section-title">
          <b>Thông tin cơ bản</b>
          <span>Tên, đường dẫn và đơn vị sản xuất</span>
        </div>
        <div className="form-two">
          <label>
            Tên phim
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                  slug: movie ? form.slug : toSlug(event.target.value),
                })
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
        </div>
        <label>
          Đường dẫn phim
          <input
            required
            pattern="[a-z0-9-]+"
            value={form.slug}
            onChange={(event) =>
              setForm({ ...form, slug: toSlug(event.target.value) })
            }
          />
          <small className="input-help">
            /phim/{form.slug || "duong-dan-phim"}
          </small>
        </label>
        <div className="form-two">
          <label>
            Studio
            <input
              required
              value={form.studio}
              onChange={(event) =>
                setForm({ ...form, studio: event.target.value })
              }
            />
          </label>
          <label>
            Đạo diễn
            <input
              required
              value={form.director}
              onChange={(event) =>
                setForm({ ...form, director: event.target.value })
              }
            />
          </label>
        </div>
        <div className="form-section-title">
          <b>Phát hành và tập phim</b>
          <span>Kiểm soát tiến độ, chất lượng và lịch cập nhật</span>
        </div>
        <div className="form-three">
          <label>
            Năm phát hành
            <input
              type="number"
              min="2000"
              max="2100"
              required
              value={form.year}
              onChange={(event) =>
                setForm({ ...form, year: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Thời lượng
            <input
              type="number"
              min="1"
              max="300"
              required
              value={form.duration}
              onChange={(event) =>
                setForm({ ...form, duration: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Chất lượng
            <select
              value={form.quality}
              onChange={(event) =>
                setForm({
                  ...form,
                  quality: event.target.value as Movie["quality"],
                })
              }
            >
              <option>4K</option>
              <option>Full HD</option>
            </select>
          </label>
        </div>
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
        <div className="form-three">
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
          <label>
            Video
            <input
              required
              value={form.video}
              onChange={(event) =>
                setForm({ ...form, video: event.target.value })
              }
            />
          </label>
        </div>
        <div className="form-section-title">
          <b>Phân loại và hiển thị</b>
          <span>Thể loại, màu poster và thông số thống kê</span>
        </div>
        <div className="genre-options">
          {genres
            .filter((genre) => genre !== "Tất cả")
            .map((genre) => (
              <label
                key={genre}
                className={form.genres.includes(genre) ? "selected" : ""}
              >
                <input
                  type="checkbox"
                  checked={form.genres.includes(genre)}
                  onChange={() => toggleGenre(genre)}
                />
                {genre}
              </label>
            ))}
        </div>
        <div className="form-three">
          <label>
            Điểm đánh giá
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={form.rating}
              onChange={(event) =>
                setForm({ ...form, rating: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Lượt xem
            <input
              type="number"
              min="0"
              value={form.views}
              onChange={(event) =>
                setForm({ ...form, views: Number(event.target.value) })
              }
            />
          </label>
          <label className="featured-toggle">
            <span>Phim nổi bật</span>
            <input
              type="checkbox"
              checked={Boolean(form.featured)}
              onChange={(event) =>
                setForm({ ...form, featured: event.target.checked })
              }
            />
          </label>
        </div>
        <div className="form-two color-fields">
          <label>
            Màu poster chính
            <input
              type="color"
              value={form.colors[0]}
              onChange={(event) =>
                setForm({
                  ...form,
                  colors: [event.target.value, form.colors[1]],
                })
              }
            />
          </label>
          <label>
            Màu poster phụ
            <input
              type="color"
              value={form.colors[1]}
              onChange={(event) =>
                setForm({
                  ...form,
                  colors: [form.colors[0], event.target.value],
                })
              }
            />
          </label>
        </div>
        <label>
          Mô tả
          <textarea
            required
            minLength={30}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </label>
        <div className="form-actions">
          <button type="button" className="secondary-btn" onClick={close}>
            Hủy
          </button>
          <button className="primary-btn">
            <Save /> Lưu phim
          </button>
        </div>
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
