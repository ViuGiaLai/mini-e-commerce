import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Minimart — Mua sắm tinh gọn mỗi ngày',
  description: 'Không gian mua sắm hiện đại cho công nghệ, thời trang và phong cách sống.',
}
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f7f8fc' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
