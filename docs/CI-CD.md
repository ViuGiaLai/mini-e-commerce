# CI/CD cho Render

Pipeline nằm tại `.github/workflows/ci-cd.yml` và triển khai service Render hiện có:

- Service ID: `srv-dapq4dgu01pc73dihfg0`
- Production URL: `https://mini-e-commerce-3l2u.onrender.com`
- Production health check: `/api/health`

## Luồng triển khai

1. Pull request vào `main`: cài dependency từ lockfile, type-check, build Next.js và build Docker image.
2. Push/merge vào `main`: chỉ chạy CD sau khi toàn bộ CI thành công.
3. CD gọi Render API với đúng `GITHUB_SHA`.
4. Workflow chờ deploy chuyển sang `live`; trạng thái build/update thất bại làm workflow thất bại.
5. Workflow gọi `https://mini-e-commerce-3l2u.onrender.com/api/health` để xác minh production.

Render là Git-backed Docker service nên Render tự build và quản lý image của bản deploy. Không push thêm một image khác lên GHCR, nhờ đó artifact được deploy luôn tương ứng với commit đã được Render liên kết.

## Thiết lập một lần

1. Tạo Render API key trong **Render Dashboard → Account Settings → API Keys**.
2. Vào repository GitHub `ViuGiaLai/mini-e-commerce` → **Settings → Secrets and variables → Actions**.
3. Tạo repository secret tên `RENDER_API_KEY` và dán API key vào.
4. Trong Render service → **Settings → Auto-Deploy**, chọn **Off**. GitHub Actions là nguồn duy nhất kích hoạt deploy, tránh deploy trùng khi vừa push lên `main`.
5. Trong Render service → **Settings → Health Check Path**, đặt `/api/health`.
6. Nên bật GitHub branch protection cho `main` và yêu cầu check **Validate and build** thành công trước khi merge.

Không commit API key hoặc deploy hook URL vào repository.
