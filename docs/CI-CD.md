# CI/CD ViuFilm3D

Pipeline chạy tự động khi có pull request hoặc push lên `main`.

## Luồng triển khai

1. Cài dependency bằng `npm ci`.
2. Kiểm tra TypeScript và build Next.js.
3. Build Docker image từ `Dockerfile`.
4. Push image với tag `latest` và SHA lên GitHub Container Registry.
5. Gọi Render API để deploy chính xác commit vừa push.
6. Chờ Render build, thay instance và chuyển deploy sang trạng thái `live`.
7. Gọi `https://mini-e-commerce-3l2u.onrender.com/api/health` để xác nhận ứng dụng hoạt động.

## Cấu hình bắt buộc

Trong GitHub repository, mở **Settings → Secrets and variables → Actions** và tạo repository secret:

- `RENDER_API_KEY`: API key của Render.
- `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase dùng lúc build frontend.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key Supabase dùng lúc build frontend.

Trong Render service `srv-dapq4dgu01pc73dihfg0`:

- Auto-Deploy: `Off`.
- Health Check Path: `/api/health`.
- Branch: `main`.
- Runtime: Docker.

Trong **Render → Environment**, cấu hình toàn bộ biến production liệt kê tại [BACKEND.md](BACKEND.md). Render chuyển các biến public thành Docker build arguments và vẫn cung cấp chúng ở runtime; các secret server không được tham chiếu bằng `ARG` trong Dockerfile.

`/api/health` là readiness check thực. Deploy sẽ không được xác nhận nếu migration Supabase chưa chạy hoặc thiếu cấu hình bắt buộc. Có thể xem chi tiết an toàn tại `/api/v1/status`.

Không cần tạo secret cho GHCR. Workflow dùng `GITHUB_TOKEN` do GitHub Actions cấp tự động.

## Chạy lại thủ công

Mở **GitHub → Actions → ViuFilm3D CI/CD → Run workflow** và chọn nhánh `main`.
