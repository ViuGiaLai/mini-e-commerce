"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  CircleAlert,
  Clapperboard,
  Eye,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { BrandLogo as Logo } from "@/components/ui/brand-logo";
import { adminGateway } from "@/lib/admin-gateway";
import { viewerSeed, type SiteSettings, type Viewer } from "@/lib/admin-data";
import { toSlug } from "@/lib/format";
import { movieGateway } from "@/lib/movie-gateway";
import { apiMode } from "@/lib/config";
import type { Movie } from "@/lib/movies";
import AdminDashboard from "@/components/admin/admin-dashboard";
import AdminMovies from "@/components/admin/admin-movies";
import AdminSchedule from "@/components/admin/admin-schedule";
import AdminSettings from "@/components/admin/admin-settings";
import AdminUsers from "@/components/admin/admin-users";
import MovieForm from "@/components/admin/movie-form";
import ViewerForm from "@/components/admin/viewer-form";
import type { AdminPanelProps } from "@/components/admin/types";

type AdminNotice = {
  message: string;
  tone: "success" | "error";
};

export default function AdminPanel({
  movies,
  setMovies,
  logout,
  pathname,
  go,
  settings,
  setSettings,
}: AdminPanelProps) {
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
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  useEffect(() => {
    let active = true;
    void adminGateway
      .listViewers()
      .then((items) => {
        if (active) setViewers(items);
      })
      .catch((error) => {
        if (!active) return;
        setNotice({
          message:
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách người dùng",
          tone: "error",
        });
      });
    return () => {
      active = false;
    };
  }, []);

  const notify = (message: string, tone: AdminNotice["tone"] = "success") => {
    setNotice({ message, tone });
    window.setTimeout(() => setNotice(null), 3500);
  };
  const notifyError = (error: unknown) => {
    notify(
      error instanceof Error ? error.message : "Thao tác không thành công",
      "error",
    );
  };
  const save = async (movie: Movie) => {
    const normalized = {
      ...movie,
      slug: movie.slug || toSlug(movie.title),
      episode: Math.min(movie.episode, movie.totalEpisodes),
    };
    try {
      const saved = await movieGateway.save(normalized);
      setMovies((current: Movie[]) => {
        const exists = current.some((item) => item.id === saved.id);
        const next = exists
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current];
        return [...next].sort((a, b) => b.id - a.id);
      });
      setEditing(undefined);
      notify(movie.title ? `Đã lưu “${movie.title}”` : "Đã lưu phim");
    } catch (error) {
      notifyError(error);
    }
  };
  const remove = async (id: number) => {
    if (!confirm("Xóa phim này khỏi thư viện?")) return;
    try {
      await movieGateway.remove(id);
      setMovies((current: Movie[]) => current.filter((item) => item.id !== id));
      notify("Đã xóa phim khỏi thư viện");
    } catch (error) {
      notifyError(error);
    }
  };
  const removeMany = async (ids: number[]) => {
    if (!ids.length || !confirm(`Xóa ${ids.length} phim đã chọn?`)) return;
    try {
      await movieGateway.removeMany(ids);
      setMovies((current: Movie[]) =>
        current.filter((item) => !ids.includes(item.id)),
      );
      notify(`Đã xóa ${ids.length} phim`);
    } catch (error) {
      notifyError(error);
    }
  };
  const duplicateMovie = async (movie: Movie) => {
    const duplicate = {
      ...movie,
      id: Date.now(),
      title: `${movie.title} — Bản sao`,
      slug: `${movie.slug}-ban-sao-${Date.now()}`,
      featured: false,
      views: 0,
    };
    try {
      const saved = await movieGateway.save(duplicate);
      setMovies((current: Movie[]) =>
        [saved, ...current].sort((a, b) => b.id - a.id),
      );
      notify("Đã nhân bản phim");
    } catch (error) {
      notifyError(error);
    }
  };
  const patchMovie = async (id: number, changes: Partial<Movie>) => {
    const current = movies.find((movie: Movie) => movie.id === id);
    if (!current) return;
    try {
      const saved = await movieGateway.save({ ...current, ...changes });
      setMovies((items: Movie[]) =>
        items
          .map((movie) => (movie.id === id ? saved : movie))
          .sort((a, b) => b.id - a.id),
      );
      notify("Đã cập nhật phim");
    } catch (error) {
      notifyError(error);
    }
  };
  const saveViewer = async (viewer: Viewer) => {
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
    try {
      const saved = await adminGateway.saveViewer(normalized);
      setViewers((current) =>
        current.some((item) => item.id === saved.id)
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      );
      setEditingViewer(undefined);
      notify("Đã lưu tài khoản");
    } catch (error) {
      notifyError(error);
    }
  };
  const patchViewer = async (id: number, changes: Partial<Viewer>) => {
    const current = viewers.find((viewer) => viewer.id === id);
    if (!current) return;
    try {
      const saved = await adminGateway.saveViewer({ ...current, ...changes });
      setViewers((items) =>
        items.map((viewer) => (viewer.id === id ? saved : viewer)),
      );
      notify("Đã cập nhật tài khoản");
    } catch (error) {
      notifyError(error);
    }
  };
  const removeViewer = async (id: number) => {
    const target = viewers.find((viewer) => viewer.id === id);
    if (!target || target.role === "admin") {
      notify("Không thể xóa tài khoản quản trị chính");
      return;
    }
    if (!confirm(`Xóa tài khoản ${target.email}?`)) return;
    try {
      await adminGateway.removeViewer(id);
      setViewers((items) => items.filter((viewer) => viewer.id !== id));
      notify("Đã xóa tài khoản");
    } catch (error) {
      notifyError(error);
    }
  };
  const saveSettings = async (next: SiteSettings) => {
    try {
      const saved = await adminGateway.saveSettings(next);
      setSettings(saved);
      notify("Đã lưu cấu hình hệ thống");
    } catch (error) {
      notifyError(error);
    }
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
        <div
          className={`admin-notice ${notice.tone}`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.tone === "error" ? <CircleAlert /> : <Check />}
          {notice.message}
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
            <span className="api-mode-badge">{apiMode}</span>
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
