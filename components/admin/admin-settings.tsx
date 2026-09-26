"use client";

import { useEffect, useState } from "react";
import { Database, Save, Settings, ShieldCheck } from "lucide-react";
import type { SiteSettings } from "@/lib/admin-data";

export default function AdminSettings({
  settings,
  save,
}: {
  settings: SiteSettings;
  save: (settings: SiteSettings) => Promise<void>;
}) {
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void save(form);
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
