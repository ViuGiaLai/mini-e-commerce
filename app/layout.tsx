import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViuFilm3D — Thế giới hoạt hình nguyên bản",
  description:
    "Nền tảng xem hoạt hình 3D với thư viện phim nguyên bản và dữ liệu được lưu cục bộ.",
  icons: {
    icon: "/viufilm3d-logo.png",
    apple: "/viufilm3d-logo.png",
  },
};
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#070a11",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
