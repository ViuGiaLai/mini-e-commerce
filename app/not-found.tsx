import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

export default function NotFound(){
  return <main className="not-found">
    <span className="shop-logo"><span><ShoppingBag size={20}/></span>minimart</span>
    <strong>404</strong>
    <h1>Trang bạn tìm không tồn tại</h1>
    <p>Đường dẫn có thể đã thay đổi hoặc nội dung không còn khả dụng.</p>
    <Link href="/" className="hero-btn"><ArrowLeft size={17}/> Về trang chủ</Link>
  </main>
}
