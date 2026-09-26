"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Settings } from "lucide-react";
import { movieSeed, type Movie } from "@/lib/movies";
import { movieGateway } from "@/lib/movie-gateway";
import { apiMode } from "@/lib/config";
import { authGateway } from "@/lib/auth-gateway";
import AdminPanel from "@/components/admin/admin-panel";
import LoginPage, { ProfilePage } from "@/components/site/account-pages";
import CatalogPage from "@/components/site/catalog-page";
import HomePage from "@/components/site/home-page";
import LibraryPage, {
  HistoryPage,
  NotFoundPage,
} from "@/components/site/library-pages";
import MovieDetail from "@/components/site/movie-detail";
import SiteFooter from "@/components/site/site-footer";
import SiteHeader, { MobileNav } from "@/components/site/site-header";
import WatchPage from "@/components/site/watch-page";
import { BrandLogo as Logo } from "@/components/ui/brand-logo";
import type { Account, HistoryItem, ThemeMode } from "@/lib/app-types";
import type {
  MovieFormat,
  MovieSortOption,
  MovieStatusFilter,
} from "@/components/site/types";
import {
  readStorage as read,
  storageKeys as storage,
  writeStorage as write,
} from "@/lib/client-storage";
import { adminGateway } from "@/lib/admin-gateway";
import { defaultSettings, type SiteSettings } from "@/lib/admin-data";

const getMovieFromPath = (path: string, list: Movie[]) => {
  const clean = path.split("?")[0];
  const seg = decodeURIComponent(clean.split("/").filter(Boolean).pop() || "");
  if (!seg) return undefined;
  const num = Number(seg);
  if (Number.isSafeInteger(num) && num > 0) {
    const byId = list.find((m) => m.id === num);
    if (byId) return byId;
  }
  return list.find((m) => m.slug === seg || String(m.id) === seg);
};

export default function DashboardApp() {
  const router = useRouter(),
    pathname = usePathname();
  const [movies, setMovies] = useState<Movie[]>(() =>
      [...movieSeed].sort((a, b) => b.id - a.id),
    ),
    [favorites, setFavorites] = useState<number[]>([]),
    [history, setHistory] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<Account | null>(null),
    [ready, setReady] = useState(false),
    [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings),
    [theme, setTheme] = useState<ThemeMode>("dark"),
    [query, setQuery] = useState(""),
    [genre, setGenre] = useState("Tất cả"),
    [format, setFormat] = useState<MovieFormat>("all"),
    [statusFilter, setStatusFilter] = useState<MovieStatusFilter>("all"),
    [sort, setSort] = useState<MovieSortOption>("new"),
    [onlyFree, setOnlyFree] = useState<boolean>(false),
    [mobile, setMobile] = useState(false),
    [toast, setToast] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => {
    let active = true;
    setFavorites(read<number[]>(storage.favorites, []));
    setHistory(read<HistoryItem[]>(storage.history, []));
    const storedAccount = read<Account | null>(storage.user, null);
    const savedTheme = localStorage.getItem(storage.theme);
    const initialTheme: ThemeMode =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    setTheme(initialTheme);
    document.documentElement.dataset.mode = initialTheme;
    void Promise.allSettled([
      movieGateway.list(),
      adminGateway.getSettings(),
      apiMode === "production"
        ? authGateway.session()
        : Promise.resolve(storedAccount),
    ]).then(([catalogResult, settingsResult, accountResult]) => {
      if (!active) return;

      const failures: string[] = [];

      if (catalogResult.status === "fulfilled") {
        const catalog = [...catalogResult.value].sort((a, b) => b.id - a.id);
        const fallback = [...movieSeed].sort((a, b) => b.id - a.id);
        setMovies(
          catalog.length || apiMode === "production" ? catalog : fallback,
        );
      } else {
        setMovies(
          apiMode === "mock" ? [...movieSeed].sort((a, b) => b.id - a.id) : [],
        );
        failures.push("danh sách phim");
      }

      if (settingsResult.status === "fulfilled") {
        setSiteSettings(settingsResult.value);
      } else {
        setSiteSettings(defaultSettings);
        failures.push("cấu hình website");
      }

      if (accountResult.status === "fulfilled") {
        setUser(accountResult.value);
        if (!accountResult.value && apiMode === "production") {
          localStorage.removeItem(storage.user);
        }
      } else {
        setUser(null);
        localStorage.removeItem(storage.user);
        failures.push("phiên đăng nhập");
      }

      if (failures.length) {
        setToast(`Không thể tải ${failures.join(", ")} từ backend.`);
      }
      setReady(true);
    });
    return () => {
      active = false;
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
      if (movie.trailer) {
        const identifier = movie.slug || movie.id;
        go(`/xem/${identifier}?trailer=1`);
        return;
      }
      flash("Phim sắp phát hành, chưa có trailer");
      return;
    }
    const isSingle = movie.totalEpisodes <= 1;
    const targetEpisode = isSingle ? 1 : episode;
    const next = [
      {
        movieId: movie.id,
        episode: targetEpisode,
        watchedAt: new Date().toISOString(),
        progress: 4,
      },
      ...history.filter((item) => item.movieId !== movie.id),
    ].slice(0, 30);
    setHistory(next);
    write(storage.history, next);
    const identifier = movie.slug || movie.id;
    go(
      isSingle
        ? `/xem/${identifier}`
        : `/xem/${identifier}?tap=${targetEpisode}`,
    );
  };
  const logout = () => {
    void authGateway.logout();
    localStorage.removeItem(storage.user);
    setUser(null);
    go("/");
    flash("Đã đăng xuất");
  };
  const selected = getMovieFromPath(pathname, movies);
  if (!ready)
    return (
      <div className="ha-loading">
        <Logo />
        <span />
      </div>
    );
  if (pathname === "/dang-nhap")
    return (
      <LoginPage
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
      <AdminPanel
        movies={movies}
        setMovies={setMovies}
        logout={logout}
        pathname={pathname}
        go={go}
        settings={siteSettings}
        setSettings={setSiteSettings}
      />
    ) : (
      <LoginPage
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
      <SiteHeader
        user={user}
        query={query}
        setQuery={setQuery}
        go={go}
        mobile={() => setMobile(true)}
        logout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
        pathname={pathname}
        format={format}
        setFormat={setFormat}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sort={sort}
        setSort={setSort}
        onlyFree={onlyFree}
        setOnlyFree={setOnlyFree}
        genre={genre}
        setGenre={setGenre}
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
          pathname={pathname}
          format={format}
          setFormat={setFormat}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sort={sort}
          setSort={setSort}
          onlyFree={onlyFree}
          setOnlyFree={setOnlyFree}
          genre={genre}
          setGenre={setGenre}
        />
      )}
      {pathname === "/" && (
        <HomePage
          movies={movies}
          go={go}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
      {pathname === "/phim" && (
        <CatalogPage
          movies={movies}
          query={query}
          setQuery={setQuery}
          genre={genre}
          setGenre={setGenre}
          format={format}
          setFormat={setFormat}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sort={sort}
          setSort={setSort}
          onlyFree={onlyFree}
          setOnlyFree={setOnlyFree}
          go={go}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
      {pathname.startsWith("/phim/") &&
        (selected ? (
          <MovieDetail
            movie={selected}
            watch={watch}
            go={go}
            favorite={favorites.includes(selected.id)}
            toggleFavorite={toggleFavorite}
          />
        ) : (
          <NotFoundPage go={go} />
        ))}
      {pathname.startsWith("/xem/") &&
        (selected ? (
          <WatchPage
            movie={selected}
            movies={movies}
            go={go}
            onWatch={watch}
            favorite={favorites.includes(selected.id)}
            toggleFavorite={toggleFavorite}
          />
        ) : (
          <NotFoundPage go={go} />
        ))}
      {pathname === "/yeu-thich" && (
        <LibraryPage
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
          <ProfilePage user={user} setUser={setUser} go={go} logout={logout} />
        ) : (
          <LoginPage
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
        !pathname.startsWith("/xem/") && <NotFoundPage go={go} />}
      <SiteFooter go={go} />
    </div>
  );
}
