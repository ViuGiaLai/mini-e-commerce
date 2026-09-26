# ViuFilm3D

ViuFilm3D là website xem hoạt hình 3D với thư viện nội dung nguyên bản. Toàn bộ tên phim, nội dung và metadata mẫu đều được tạo riêng trong repository; ứng dụng không gọi API dữ liệu phim bên ngoài. Chế độ production dùng Supabase cho dữ liệu nghiệp vụ và Cloudflare R2 cho video, poster, phụ đề, audio.

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Chạy bằng Docker

```bash
docker build -t viufilm3d:local .
docker run --rm -p 10000:10000 viufilm3d:local
```

Mở `http://localhost:10000`.

## Tài khoản mẫu (chế độ mock)

- Người xem: `user@gmail.com` / `123456`
- Quản trị: `admin@gmail.com` / `123456`

Ở chế độ production, đăng nhập quản trị sử dụng `ADMIN_EMAIL` và `ADMIN_PASSWORD` được cấu hình trên server; tài khoản mẫu không được chấp nhận.

Ở chế độ `mock`, dữ liệu phim, người dùng, cấu hình, yêu thích và lịch sử xem được lưu trong `localStorage`. Ở chế độ `production`, kho phim, người dùng và cấu hình được quản lý bằng Next.js API + Supabase; yêu thích và lịch sử xem vẫn thuộc từng trình duyệt.

## CI/CD

Mỗi lần push lên `main`, GitHub Actions sẽ kiểm tra mã nguồn, build ứng dụng, đóng gói và publish Docker image lên GHCR, sau đó deploy đúng commit lên Render và xác nhận endpoint `/api/health`.

Hướng dẫn cấu hình: [docs/CI-CD.md](docs/CI-CD.md).

## Backend

Dự án hỗ trợ hai nguồn dữ liệu qua `NEXT_PUBLIC_API_MODE`:

- `mock`: dữ liệu mẫu lưu trên trình duyệt.
- `production`: Next.js API kết nối Supabase, xác thực quản trị bằng cookie `HttpOnly` đã ký.

Hướng dẫn cấu hình và tạo database: [docs/BACKEND.md](docs/BACKEND.md).

Tổng quan cấu trúc và quy tắc phát triển: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Thiết lập Cloudflare R2 cho video, poster, phụ đề và audio: [docs/R2.md](docs/R2.md).
