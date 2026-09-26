"use client";

import { useState } from "react";
import {
  Pencil,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import type { Viewer } from "@/lib/admin-data";
import type { EditViewer, PatchViewer } from "@/components/admin/types";

type AdminUsersProps = {
  viewers: Viewer[];
  edit: EditViewer;
  patch: PatchViewer;
  remove: (id: number) => Promise<void>;
};

export default function AdminUsers({
  viewers,
  edit,
  patch,
  remove,
}: AdminUsersProps) {
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
                    disabled={viewer.role === "admin"}
                    title={
                      viewer.role === "admin"
                        ? "Không thể xóa tài khoản quản trị viên"
                        : "Xóa tài khoản này"
                    }
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
