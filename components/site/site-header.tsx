"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  X,
} from "lucide-react";
import { BrandLogo as Logo } from "@/components/ui/brand-logo";
import { genres } from "@/lib/movies";
import type { Dispatch, SetStateAction } from "react";
import type {
  HeaderProps,
  MovieFormat,
  MovieSortOption,
  MovieStatusFilter,
} from "@/components/site/types";

type SiteHeaderProps = HeaderProps & {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  mobile: () => void;
  format?: MovieFormat;
  setFormat?: Dispatch<SetStateAction<MovieFormat>>;
  statusFilter?: MovieStatusFilter;
  setStatusFilter?: Dispatch<SetStateAction<MovieStatusFilter>>;
  sort?: MovieSortOption;
  setSort?: Dispatch<SetStateAction<MovieSortOption>>;
  onlyFree?: boolean;
  setOnlyFree?: Dispatch<SetStateAction<boolean>>;
  genre?: string;
  setGenre?: Dispatch<SetStateAction<string>>;
};

export default function SiteHeader({
  user,
  query,
  setQuery,
  go,
  mobile,
  logout,
  theme,
  toggleTheme,
  pathname = "/",
  format = "all",
  setFormat,
  statusFilter = "all",
  setStatusFilter,
  sort = "new",
  setSort,
  onlyFree = false,
  setOnlyFree,
  genre = "Tất cả",
  setGenre,
}: SiteHeaderProps) {
  const [genreOpen, setGenreOpen] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(event.target as Node)
      ) {
        setGenreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetFilters = () => {
    setFormat?.("all");
    setStatusFilter?.("all");
    setGenre?.("Tất cả");
    setOnlyFree?.(false);
    setSort?.("new");
    setQuery("");
  };

  return (
    <header className="ha-header">
      <div className="ha-container ha-header-inner">
        <button className="mobile-menu" onClick={mobile} aria-label="Mở menu">
          <Menu />
        </button>
        <button
          onClick={() => {
            resetFilters();
            go("/");
          }}
        >
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
          <button
            className={pathname === "/" ? "active" : ""}
            onClick={() => {
              resetFilters();
              go("/");
            }}
          >
            Phim mới
          </button>
          <div
            className="genre-dropdown-wrap"
            ref={genreDropdownRef}
            onMouseEnter={() => setGenreOpen(true)}
            onMouseLeave={() => setGenreOpen(false)}
          >
            <button
              type="button"
              className={`genre-dropdown-trigger ${
                genreOpen ||
                (pathname === "/phim" &&
                  (genre !== "Tất cả" ||
                    (format === "all" &&
                      statusFilter === "all" &&
                      !onlyFree &&
                      sort === "new")))
                  ? "active"
                  : ""
              }`}
              onClick={() => setGenreOpen((prev) => !prev)}
              aria-expanded={genreOpen}
            >
              <span>Thể loại {genre !== "Tất cả" ? `(${genre})` : ""}</span>
              <ChevronDown
                size={13}
                className={`genre-chevron ${genreOpen ? "open" : ""}`}
              />
            </button>

            {genreOpen && (
              <div className="genre-dropdown-menu">
                <div className="genre-dropdown-grid">
                  {genres.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`genre-menu-item ${genre === item ? "active" : ""}`}
                      onClick={() => {
                        setGenre?.(item);
                        setFormat?.("all");
                        setStatusFilter?.("all");
                        setOnlyFree?.(false);
                        setGenreOpen(false);
                        go("/phim");
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            className={pathname === "/phim" && sort === "views" ? "active" : ""}
            onClick={() => {
              setSort?.("views");
              go("/phim");
            }}
          >
            Đang hot
          </button>
          <button
            className={
              pathname === "/phim" && format === "series" ? "active" : ""
            }
            onClick={() => {
              setFormat?.("series");
              go("/phim");
            }}
          >
            Phim bộ
          </button>
          <button
            className={
              pathname === "/phim" && format === "single" ? "active" : ""
            }
            onClick={() => {
              setFormat?.("single");
              go("/phim");
            }}
          >
            Phim lẻ
          </button>
          <button
            className={
              pathname === "/phim" && statusFilter === "Hoàn thành"
                ? "active"
                : ""
            }
            onClick={() => {
              setStatusFilter?.("Hoàn thành");
              go("/phim");
            }}
          >
            Hoàn thành
          </button>
          <button
            className={pathname === "/phim" && onlyFree ? "active" : ""}
            onClick={() => {
              setOnlyFree?.(!onlyFree);
              go("/phim");
            }}
          >
            Miễn phí
          </button>
          <button
            className={pathname === "/lich-su" ? "active" : ""}
            onClick={() => go("/lich-su")}
          >
            Lịch sử
          </button>
        </div>
      </nav>
    </header>
  );
}

export function MobileNav({
  user,
  go,
  close,
  logout,
  theme,
  toggleTheme,
  pathname = "/",
  format = "all",
  setFormat,
  statusFilter = "all",
  setStatusFilter,
  sort = "new",
  setSort,
  onlyFree = false,
  setOnlyFree,
  genre = "Tất cả",
  setGenre,
}: HeaderProps & {
  close: () => void;
  format?: MovieFormat;
  setFormat?: Dispatch<SetStateAction<MovieFormat>>;
  statusFilter?: MovieStatusFilter;
  setStatusFilter?: Dispatch<SetStateAction<MovieStatusFilter>>;
  sort?: MovieSortOption;
  setSort?: Dispatch<SetStateAction<MovieSortOption>>;
  onlyFree?: boolean;
  setOnlyFree?: Dispatch<SetStateAction<boolean>>;
  genre?: string;
  setGenre?: Dispatch<SetStateAction<string>>;
}) {
  const [mobileGenresOpen, setMobileGenresOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const resetFilters = () => {
    setFormat?.("all");
    setStatusFilter?.("all");
    setGenre?.("Tất cả");
    setOnlyFree?.(false);
    setSort?.("new");
  };

  return (
    <div className="mobile-layer">
      <button className="mobile-backdrop" onClick={close} />
      <aside>
        <button className="mobile-close" onClick={close}>
          <X />
        </button>
        <Logo />
        <strong>Danh mục</strong>
        <button
          className={pathname === "/" ? "active" : ""}
          onClick={() => {
            resetFilters();
            go("/");
          }}
        >
          Phim mới
        </button>
        <div className="mobile-genre-group">
          <button
            type="button"
            className={`mobile-genre-toggle ${genre !== "Tất cả" ? "active" : ""}`}
            onClick={() => setMobileGenresOpen(!mobileGenresOpen)}
          >
            <span>Thể loại {genre !== "Tất cả" ? `(${genre})` : ""}</span>
            <ChevronDown size={14} className={mobileGenresOpen ? "open" : ""} />
          </button>
          {mobileGenresOpen && (
            <div className="mobile-genre-subitems">
              {genres.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`mobile-genre-subitem ${genre === item ? "active" : ""}`}
                  onClick={() => {
                    setGenre?.(item);
                    setFormat?.("all");
                    setStatusFilter?.("all");
                    setOnlyFree?.(false);
                    close();
                    go("/phim");
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={pathname === "/phim" && sort === "views" ? "active" : ""}
          onClick={() => {
            setSort?.("views");
            go("/phim");
          }}
        >
          Đang hot
        </button>
        <button
          className={
            pathname === "/phim" && format === "series" ? "active" : ""
          }
          onClick={() => {
            setFormat?.("series");
            go("/phim");
          }}
        >
          Phim bộ
        </button>
        <button
          className={
            pathname === "/phim" && format === "single" ? "active" : ""
          }
          onClick={() => {
            setFormat?.("single");
            go("/phim");
          }}
        >
          Phim lẻ (Bản Full)
        </button>
        <button
          className={
            pathname === "/phim" && statusFilter === "Hoàn thành"
              ? "active"
              : ""
          }
          onClick={() => {
            setStatusFilter?.("Hoàn thành");
            go("/phim");
          }}
        >
          Hoàn thành
        </button>
        <button
          className={pathname === "/phim" && onlyFree ? "active" : ""}
          onClick={() => {
            setOnlyFree?.(!onlyFree);
            go("/phim");
          }}
        >
          Phim miễn phí
        </button>
        <button
          className={pathname === "/yeu-thich" ? "active" : ""}
          onClick={() => go("/yeu-thich")}
        >
          Phim yêu thích
        </button>
        <button
          className={pathname === "/lich-su" ? "active" : ""}
          onClick={() => go("/lich-su")}
        >
          Lịch sử xem
        </button>
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
