"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import type { Viewer } from "@/lib/admin-data";

type ViewerFormProps = {
  viewer: Viewer | null;
  close: () => void;
  save: (viewer: Viewer) => Promise<void>;
};

export default function ViewerForm({ viewer, close, save }: ViewerFormProps) {
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
    void save({
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
