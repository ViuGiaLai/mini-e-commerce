# Kiến trúc ViuFilm3D

## Mục tiêu

Ứng dụng hỗ trợ hai chế độ dữ liệu mà không thay đổi code giao diện:

- `mock`: dữ liệu mẫu nằm trong source và được chỉnh sửa trong `localStorage`.
- `production`: giao diện gọi Next.js Route Handlers; backend đọc/ghi Supabase.

Chế độ được chọn duy nhất bằng `NEXT_PUBLIC_API_MODE`. Component giao diện không được gọi Supabase trực tiếp.

## Cấu trúc thư mục

```text
app/
├── api/                    Route Handlers, chỉ nhận/trả HTTP
├── admin/                  Route UI khu vực quản trị
└── ...                     Route UI công khai

components/
├── admin/                  Layout, từng màn hình và form quản trị
├── site/                   Trang và thành phần website công khai
├── ui/                     Thành phần trình bày dùng chung
└── dashboard-app.tsx       Điều phối state và route phía client

lib/
├── *-gateway.ts            Cổng dữ liệu mock/production cho frontend
├── api-client.ts           HTTP client và chuẩn hóa lỗi frontend
├── client-storage.ts       Khóa và thao tác localStorage
├── config.ts               Cấu hình public đã được chuẩn hóa
├── server/                 Session, validation, repository, lỗi backend
├── supabase/               Khởi tạo Supabase client phía server
└── movies.ts               Kiểu và bộ dữ liệu phim mẫu

supabase/migrations/        Migration SQL chạy theo thứ tự tên file
scripts/                    Seed database và công cụ deploy
docs/                       Tài liệu kiến trúc, backend và CI/CD
```

## Luồng dữ liệu

```text
React component
  → gateway
      → mock: localStorage
      → production: /api/v1/*
          → validation
          → repository
          → Supabase + RLS

Admin media upload
  → API tạo presigned URL
  → trình duyệt tải thẳng tới Cloudflare R2
  → API xác nhận object
```

Không được import `lib/supabase/server.ts` vào Client Component. Secret key chỉ được đọc trong module server.

## Phân chia trách nhiệm

- Component: hiển thị và xử lý tương tác, không chứa câu lệnh database.
- Gateway: lựa chọn nguồn dữ liệu và chuyển lỗi HTTP thành lỗi ứng dụng.
- Route Handler: xác thực quyền, kiểm tra request và tạo response.
- Validator: chuẩn hóa và từ chối dữ liệu sai trước khi vào repository.
- Repository: chuyển đổi camelCase/snake_case và thao tác Supabase.
- Migration: định nghĩa schema, constraint, index, trigger và RLS.

## Quy tắc bảo mật

- `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD`, `AUTH_SECRET` chỉ tồn tại ở runtime server.
- Không thêm tiền tố `NEXT_PUBLIC_` vào secret.
- API ghi dữ liệu yêu cầu cookie quản trị `HttpOnly`, `SameSite=Lax` có chữ ký.
- Client không được quyết định quyền truy cập; backend luôn kiểm tra lại session.
- `app_users` không có policy đọc công khai. `movies` và `site_settings` chỉ cho phép public đọc.
- Lỗi database chi tiết chỉ ghi server log; client nhận thông báo an toàn.

## Thêm một nghiệp vụ mới

1. Khai báo type miền dữ liệu trong `lib/`.
2. Thêm migration mới, không sửa migration đã chạy trên production.
3. Thêm validator và repository trong `lib/server/`.
4. Thêm Route Handler trong `app/api/v1/`.
5. Thêm phương thức gateway hỗ trợ cả mock và production.
6. Component chỉ gọi gateway và hiển thị trạng thái tải/lỗi.
7. Cập nhật `.env.example` và tài liệu nếu có cấu hình mới.

## Quy ước migration

Migration dùng timestamp tăng dần và chỉ thực hiện một nhóm trách nhiệm:

- `20260926000000_create_movies.sql`: kho phim công khai.
- `20260926001000_create_admin.sql`: người dùng quản trị và cấu hình website.
- `20260926002000_add_movie_media.sql`: object key poster, phụ đề và audio.

Khi schema đã được chạy trên môi trường thật, luôn tạo migration mới để thay đổi; không chỉnh sửa file cũ.
