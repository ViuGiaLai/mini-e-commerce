# Backend và Supabase

Frontend chỉ làm việc với các gateway dữ liệu (`movieGateway`, `adminGateway`, `authGateway`). Nguồn dữ liệu được chọn bằng một biến môi trường:

```ini
NEXT_PUBLIC_API_MODE=mock
```

- `mock`: đọc và ghi phim, người dùng và cấu hình mẫu trong `localStorage`.
- `production`: gọi REST API `/api/v1`; API kết nối tới Supabase.

Đổi mode cần khởi động lại `npm run dev`. Khi deploy, cần build lại vì biến `NEXT_PUBLIC_*` được Next.js đóng vào bundle lúc build.

## 1. Cấu hình local

Tạo `.env.local`:

```ini
NEXT_PUBLIC_API_MODE=mock
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
SUPABASE_SECRET_KEY=sb_secret_your_server_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
AUTH_SECRET=replace-with-at-least-32-random-characters
```

`SUPABASE_SECRET_KEY` chỉ tồn tại ở server. Không thêm tiền tố `NEXT_PUBLIC_` và không commit khóa này lên Git.

`ADMIN_PASSWORD`, `AUTH_SECRET` và `SUPABASE_SECRET_KEY` đều là bí mật phía server. Backend tạo cookie `HttpOnly`, `SameSite=Lax` đã ký sau khi admin đăng nhập. API ghi phim, quản lý người dùng và cập nhật cấu hình đều từ chối yêu cầu không có phiên admin hợp lệ. Khi tải lại trang, frontend kiểm tra lại phiên qua `/api/v1/auth/session` thay vì tin dữ liệu tài khoản trong `localStorage`.

Phiên production hiện dành cho khu vực quản trị. Các tài khoản người xem trong `app_users` là dữ liệu quản lý hồ sơ, không chứa mật khẩu và không được dùng để giả lập một hệ thống đăng nhập không an toàn. Chế độ mock vẫn hỗ trợ hai tài khoản mẫu để trình diễn giao diện học tập.

Mật khẩu Postgres không được dùng bởi `supabase-js` trong kiến trúc hiện tại.

## 2. Tạo bảng

Mở **Supabase Dashboard → SQL Editor**, chạy lần lượt:

```text
supabase/migrations/20260926000000_create_movies.sql
supabase/migrations/20260926001000_create_admin.sql
supabase/migrations/20260926002000_add_movie_media.sql
```

Migration tạo các bảng `movies`, `app_users`, `site_settings`, index, ràng buộc dữ liệu, trigger `updated_at` và Row Level Security:

- `movies`: công khai chỉ được đọc; ghi qua backend.
- `site_settings`: công khai chỉ được đọc; ghi qua backend.
- `app_users`: không công khai; chỉ backend dùng secret key được truy cập.

## 3. Nạp dữ liệu mẫu lên Supabase

Sau khi thêm `SUPABASE_SECRET_KEY` vào `.env.local`:

```bash
npm run db:seed
```

Lệnh nạp phim mẫu, tài khoản mẫu và cấu hình mặc định. Có thể chạy lại nhiều lần vì dùng `upsert` theo `id`.

## 4. API hiện có

- `GET /api/v1/movies`: danh sách phim công khai.
- `GET /api/v1/movies/:id`: chi tiết phim công khai.
- `PUT/DELETE /api/v1/movies/:id`: quản trị phim.
- `DELETE /api/v1/movies`: xóa nhiều phim.
- `GET /api/v1/users`: danh sách tài khoản cho quản trị.
- `PUT/DELETE /api/v1/users/:id`: quản trị tài khoản.
- `GET /api/v1/settings`: cấu hình hiển thị công khai.
- `PUT /api/v1/settings`: cập nhật cấu hình.
- `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/session`: phiên quản trị.
- `GET /api/v1/status`: trạng thái kết nối API và database, không trả về bí mật.
- `/api/v1/media/*`: upload, xác nhận, đọc, liệt kê và xóa media trên R2.

## 5. Chuyển sang backend thật

```ini
NEXT_PUBLIC_API_MODE=production
```

Sau đó khởi động lại:

```bash
npm run dev
```

## 6. Biến môi trường trên Render

Thêm các biến sau trong **Render → Environment**:

- `NEXT_PUBLIC_API_MODE=production`
- `NEXT_PUBLIC_API_BASE_URL=`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AUTH_SECRET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT`
- `R2_BUCKET`

Không đưa mật khẩu database hoặc secret key vào GitHub workflow, Dockerfile hay mã nguồn.

Hướng dẫn R2 và CORS: [R2.md](R2.md).

Với GitHub Actions, thêm hai secret dùng trong bước build Docker vì biến `NEXT_PUBLIC_*` được đóng vào frontend khi build:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD` và `AUTH_SECRET` chỉ cấu hình tại môi trường chạy trên Render, không truyền thành Docker build argument.

## 7. Docker production

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_MODE=production \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key \
  -t viufilm3d:production .

docker run --rm -p 10000:10000 \
  -e NEXT_PUBLIC_API_MODE=production \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key \
  -e SUPABASE_SECRET_KEY=sb_secret_your_server_key \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=replace-with-a-strong-password \
  -e AUTH_SECRET=replace-with-at-least-32-random-characters \
  viufilm3d:production
```

Các giá trị trong ví dụ là placeholder. Không đưa khóa thật vào lịch sử terminal dùng chung hoặc commit Git.

## 8. Readiness và health check

- `GET /api/health` là health check dùng cho Render. Ở production, endpoint chỉ trả `200` khi bảng `movies` truy cập được và toàn bộ cấu hình ghi database, đăng nhập admin, R2 đã có. Nếu thiếu, endpoint trả `503` với `status=degraded`.
- `GET /api/v1/status` trả trạng thái chi tiết nhưng không trả giá trị secret: `database`, `databaseAdmin`, `adminAuth`, `objectStorage` và `ready`.

Nếu `database=unavailable` nhưng URL/key Supabase đã đúng, kiểm tra đã chạy đủ ba migration hay chưa. Nếu `databaseAdmin=not_configured` hoặc `adminAuth=not_configured`, bổ sung các biến server còn thiếu rồi khởi động lại service.

Kiểm tra toàn bộ cấu hình backend và ba bảng mà không in giá trị secret:

```bash
npm run backend:check
```

Do `/api/health` kiểm tra readiness thật, Render sẽ không đánh dấu phiên bản mới khỏe khi database chưa được khởi tạo. Hãy chạy migration và cấu hình environment trước lần deploy production tiếp theo.
