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

const themeScript = `
  try {
    const savedTheme = localStorage.getItem("viufilm3d-theme");
    const theme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    document.documentElement.dataset.mode = theme;
  } catch {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
