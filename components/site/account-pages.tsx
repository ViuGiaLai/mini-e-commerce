"use client";

import { useState } from "react";
import { Heart, History, LogOut, X } from "lucide-react";
import { BrandLogo as Logo } from "@/components/ui/brand-logo";
import { adminGateway } from "@/lib/admin-gateway";
import type { Account } from "@/lib/app-types";
import { authGateway } from "@/lib/auth-gateway";
import {
  storageKeys as storage,
  writeStorage as write,
} from "@/lib/client-storage";
import { apiMode } from "@/lib/config";
import type { Dispatch, SetStateAction } from "react";
import type { Navigate } from "@/components/site/types";

type LoginPageProps = {
  onLogin: (account: Account) => void;
  close: () => void;
};

export default function LoginPage({ onLogin, close }: LoginPageProps) {
  const isProduction = apiMode === "production";
  const [email, setEmail] = useState(isProduction ? "" : "user@gmail.com"),
    [password, setPassword] = useState(isProduction ? "" : "123456"),
    [error, setError] = useState(""),
    [submitting, setSubmitting] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    if (apiMode === "production") {
      try {
        const account = await authGateway.login(
          email.trim().toLowerCase(),
          password,
        );
        if (account) onLogin(account);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Không thể đăng nhập backend.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const viewers = await adminGateway.listViewers();
    const viewer = viewers.find(
      (item) => item.email === email.trim().toLowerCase(),
    );
    if (!viewer || password !== "123456") {
      setError("Email hoặc mật khẩu không chính xác.");
      setSubmitting(false);
      return;
    }
    if (viewer.status === "Đã khóa") {
      setError("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
      setSubmitting(false);
      return;
    }
    onLogin({ email: viewer.email, name: viewer.name, role: viewer.role });
    setSubmitting(false);
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
        <p className="mini-label">
          {isProduction ? "KHU VỰC QUẢN TRỊ" : "TÀI KHOẢN VIUFILM3D"}
        </p>
        <h2>{isProduction ? "Đăng nhập quản trị" : "Chào mừng trở lại"}</h2>
        <span>
          {isProduction
            ? "Sử dụng tài khoản quản trị đã cấu hình trên máy chủ."
            : "Đăng nhập để dùng dữ liệu tài khoản mẫu trên trình duyệt."}
        </span>
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
        <button className="primary-btn full" disabled={submitting}>
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
        {!isProduction && (
          <div className="demo-accounts-box">
            <span>Tài khoản mẫu thử nghiệm (Mock mode):</span>
            <div className="demo-btns">
              <button
                type="button"
                className="demo-btn"
                onClick={() => {
                  setEmail("user@gmail.com");
                  setPassword("123456");
                  setError("");
                }}
              >
                👤 Người xem (user@gmail.com)
              </button>
              <button
                type="button"
                className="demo-btn admin"
                onClick={() => {
                  setEmail("admin@gmail.com");
                  setPassword("123456");
                  setError("");
                }}
              >
                🛡️ Quản trị viên (admin@gmail.com)
              </button>
            </div>
            <small>Mật khẩu: 123456</small>
          </div>
        )}
      </form>
    </main>
  );
}
type ProfilePageProps = {
  user: Account;
  setUser: Dispatch<SetStateAction<Account | null>>;
  go: Navigate;
  logout: () => void;
};

export function ProfilePage({ user, setUser, go, logout }: ProfilePageProps) {
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
