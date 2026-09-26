"use client";

import { BrandLogo as Logo } from "@/components/ui/brand-logo";
import type { Navigate } from "@/components/site/types";

export default function SiteFooter({ go }: { go: Navigate }) {
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
