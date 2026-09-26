import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found">
      <span className="ha-logo">
        <img src="/viufilm3d-logo.png" alt="Logo ViuFilm3D" />
        <span>
          <b>ViuFilm3D</b>
          <small>XEM PHIM TRỰC TUYẾN</small>
        </span>
      </span>
      <strong>404</strong>
      <h1>Khung hình này không tồn tại</h1>
      <p>Đường dẫn có thể đã thay đổi hoặc bộ phim không còn trong thư viện.</p>
      <Link href="/" className="primary-btn">
        <ArrowLeft size={17} /> Về trang chủ
      </Link>
    </main>
  );
}
