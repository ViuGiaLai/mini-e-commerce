'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, BarChart3, Check, ChevronRight, CircleDollarSign, Heart, LayoutDashboard, LogOut, Menu, Package, Pencil, Plus, Search, ShoppingBag, Star, Trash2, Truck, User, Users, X } from 'lucide-react'
import { CATALOG_VERSION, productSeed, type Product } from '@/lib/products'

type CartItem = Product & { quantity:number }
type Order = { id:string; date:string; createdAt?:string; items:CartItem[]; total:number; payment:string; status:string; customer:string; customerEmail:string; phone?:string; address:string; note?:string }
type Account = { email:string; role:'admin'|'user'; name:string; phone?:string; address?:string }
type Page = 'home'|'products'|'detail'|'cart'|'checkout'|'success'|'orders'|'wishlist'|'profile'|'login'|'admin'

const money=(n:number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n)
const categories=['Tất cả','Điện tử','Điện thoại','Laptop','Thời trang','Giày dép','Phụ kiện','Nhà cửa']
const categoryMap:Record<string,string>={'Smartphones':'Điện thoại','Laptops':'Laptop','Fashion':'Thời trang','Shoes':'Giày dép','Accessories':'Phụ kiện','Home & Living':'Nhà cửa'}
const categoryLabel=(value:string)=>categoryMap[value]||value
const itemCount=(items:CartItem[])=>items.reduce((sum,item)=>sum+item.quantity,0)
const shippingFee=(subtotal:number)=>subtotal<=0||subtotal>=10_000_000?0:30_000
const adminTitles:Record<string,string>={Dashboard:'Tổng quan',Products:'Sản phẩm',Orders:'Đơn hàng',Customers:'Khách hàng'}
const statusMap:Record<string,string>={Pending:'Chờ xác nhận',Processing:'Đang xử lý',Shipping:'Đang giao',Completed:'Hoàn thành',Cancelled:'Đã hủy'}
const normalizedStatus=(status:string)=>statusMap[status]||status
const orderTransitions:Record<string,string[]>={'Chờ xác nhận':['Đang xử lý','Đã hủy'],'Đang xử lý':['Đang giao','Đã hủy'],'Đang giao':['Hoàn thành'],'Hoàn thành':[],'Đã hủy':[]}
const statusSlug=(status:string)=>status==='Hoàn thành'?'completed':status==='Đã hủy'?'cancelled':status==='Đang giao'?'shipping':'pending'
const profileKey=(email:string)=>`mc-profile:${email}`
const syncCart=(items:CartItem[],catalog:Product[])=>items.flatMap(item=>{
 const product=catalog.find(candidate=>candidate.id===item.id)
 if(!product||product.stock<=0)return []
 return [{...product,quantity:Math.min(Math.max(1,item.quantity),product.stock)}]
})
const mergeCarts=(current:CartItem[],saved:CartItem[],catalog:Product[])=>{
 const quantities=new Map<number,number>()
 ;[...saved,...current].forEach(item=>quantities.set(item.id,(quantities.get(item.id)||0)+item.quantity))
 return syncCart(catalog.filter(product=>quantities.has(product.id)).map(product=>({...product,quantity:quantities.get(product.id)||1})),catalog)
}
const pageRoutes:Record<Exclude<Page,'detail'>,string>={home:'/',products:'/san-pham',cart:'/gio-hang',checkout:'/thanh-toan',success:'/dat-hang-thanh-cong',orders:'/don-hang',wishlist:'/yeu-thich',profile:'/tai-khoan',login:'/dang-nhap',admin:'/admin'}
const pageFromPath=(path:string):Page=>path==='/'?'home':path.startsWith('/san-pham/')?'detail':path==='/san-pham'?'products':path==='/gio-hang'?'cart':path==='/thanh-toan'?'checkout':path==='/dat-hang-thanh-cong'?'success':path==='/don-hang'?'orders':path==='/yeu-thich'?'wishlist':path==='/tai-khoan'?'profile':path==='/dang-nhap'?'login':path.startsWith('/admin')?'admin':'home'

// ---- storage helpers -------------------------------------------------------
// Cart/wishlist are personal => scoped per account email (guests get their own scope).
// Orders are store-wide (admin sees all) but each order carries the buyer's email,
// and each user only ever sees their own orders.
const personalKey=(base:string,acc:Account|null)=>`${base}:${acc?acc.email:'guest'}`
const readJSON=<T,>(key:string,fallback:T):T=>{
 try{const raw=localStorage.getItem(key);return raw?(JSON.parse(raw) as T):fallback}catch{return fallback}
}
const readArray=<T,>(key:string,fallback:T[]=[]):T[]=>{const value=readJSON<unknown>(key,fallback);return Array.isArray(value)?value as T[]:fallback}
const writeJSON=(key:string,value:unknown)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
const legacySeedNames=['iPhone 15 Pro','MacBook Air M3','Sony WH-1000XM5','Áo sơ mi Linen cổ điển','Nike Air Max 270','Bộ gốm tối giản']
const isUntouchedLegacyCatalog=(catalog:Product[])=>catalog.length===legacySeedNames.length&&catalog.every((product,index)=>product.id===index+1&&product.name===legacySeedNames[index])

export default function DashboardApp(){
 const router=useRouter(),pathname=usePathname()
 const [user,setUser]=useState<Account|null>(null)
 const [login,setLogin]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('')
 const [loginReturnTo,setLoginReturnTo]=useState('/')
 const [products,setProducts]=useState<Product[]>(productSeed)
 const [cart,setCart]=useState<CartItem[]>([]),[wishlist,setWishlist]=useState<number[]>([]),[orders,setOrders]=useState<Order[]>([])
 const [page,setPage]=useState<Page>(()=>pageFromPath(pathname)),[selected,setSelected]=useState<Product|null>(null),[lastOrder,setLastOrder]=useState<Order|null>(null)
 const [query,setQuery]=useState(''),[category,setCategory]=useState('Tất cả'),[toast,setToast]=useState(''),[mobile,setMobile]=useState(false),[ready,setReady]=useState(false)
 const toastTimer=useRef<number|null>(null)
 useEffect(()=>()=>{if(toastTimer.current)window.clearTimeout(toastTimer.current)},[])

 // Load session first, then load data that belongs to that session
 useEffect(()=>{
  const session=readJSON<Account|null>('mc-user',null)
  const acc=session?{...session,...readJSON<Partial<Account>>(profileKey(session.email),{})}:null
  const storedCatalog=readArray<Product>('mc-products')
  const storedVersion=readJSON<number>('mc-catalog-version',0)
  let catalog=storedCatalog.length?storedCatalog:productSeed
  if(storedVersion!==CATALOG_VERSION){
   if(storedCatalog.length&&!localStorage.getItem(`mc-products-backup-v${storedVersion}`))writeJSON(`mc-products-backup-v${storedVersion}`,storedCatalog)
   if(!storedCatalog.length||isUntouchedLegacyCatalog(storedCatalog))catalog=productSeed
   else{
    const existingIds=new Set(storedCatalog.map(product=>product.id))
    catalog=[...storedCatalog,...productSeed.filter(product=>!existingIds.has(product.id))]
   }
   writeJSON('mc-products',catalog);writeJSON('mc-catalog-version',CATALOG_VERSION)
  }
  setUser(acc)
  const syncedCart=syncCart(readArray<CartItem>(personalKey('mc-cart',acc)),catalog)
  setCart(syncedCart);writeJSON(personalKey('mc-cart',acc),syncedCart)
  setWishlist(readArray<number>(personalKey('mc-wishlist',acc)).filter(id=>catalog.some(product=>product.id===id)))
  const storedOrders=readArray<Order>('mc-orders').map(order=>({...order,status:normalizedStatus(order.status)}))
  setOrders(storedOrders);writeJSON('mc-orders',storedOrders)
  setProducts(catalog)
  setReady(true)
 },[])
 useEffect(()=>{
  const nextPage=pageFromPath(pathname)
  setPage(nextPage)
  setLogin(nextPage==='login')
  if(nextPage==='detail'){
   const id=Number(pathname.split('/').pop())
   const source=readArray<Product>('mc-products',productSeed)
   setSelected(source.find(product=>product.id===id)||null)
  }
 },[pathname])
 // Persist on change (only after initial load so we never wipe saved data with empty arrays)
 useEffect(()=>{if(ready)writeJSON(personalKey('mc-cart',user),cart)},[cart,ready,user])
 useEffect(()=>{if(ready)writeJSON(personalKey('mc-wishlist',user),wishlist)},[wishlist,ready,user])

 const flash=(m:string)=>{setToast(m);if(toastTimer.current)window.clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setToast(''),2500)}
 const saveCart=(next:CartItem[])=>setCart(next)
 const saveProducts=(next:Product[])=>{setProducts(next);writeJSON('mc-products',next)}
 const saveOrders=(next:Order[])=>{setOrders(next);writeJSON('mc-orders',next)}

 const add=(p:Product,qty:number=1)=>{
  const inCart=cart.find(x=>x.id===p.id)?.quantity||0
  const room=p.stock-inCart
  if(room<=0){flash('Sản phẩm đã đạt số lượng tối đa trong giỏ');return}
  const take=Math.min(qty,room)
  const next=cart.some(x=>x.id===p.id)
   ?cart.map(x=>x.id===p.id?{...x,quantity:x.quantity+take}:x)
   :[...cart,{...p,quantity:take}]
  saveCart(next);flash(`Đã thêm ${take} sản phẩm vào giỏ`)
 }
 const toggleWish=(id:number)=>{
  const next=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id]
  setWishlist(next)
  flash(wishlist.includes(id)?'Đã bỏ khỏi yêu thích':'Đã lưu vào yêu thích')
 }
 // `detail` keeps the selected product; every other page clears it
 const navigate=(p:Page)=>{if(p!=='detail')setSelected(null);setPage(p);setMobile(false);router.push(p==='detail'&&selected?`/san-pham/${selected.id}`:pageRoutes[p as Exclude<Page,'detail'>]||'/');window.scrollTo({top:0,behavior:'smooth'})}
 const openProduct=(p:Product)=>{setSelected(p);setMobile(false);router.push(`/san-pham/${p.id}`);window.scrollTo({top:0,behavior:'smooth'})}

 const loadFor=(acc:Account|null)=>{
  setCart(syncCart(readArray<CartItem>(personalKey('mc-cart',acc)),products))
  setWishlist(readArray<number>(personalKey('mc-wishlist',acc)).filter(id=>products.some(product=>product.id===id)))
 }
 const openLogin=(returnTo:string='/')=>{setLoginReturnTo(returnTo);setError('');setLogin(true);router.push('/dang-nhap')}
 const doLogin=(e:any)=>{
  e.preventDefault()
  const accounts:Record<string,Account>={
   'admin@gmail.com':{email:'admin@gmail.com',role:'admin',name:'Admin User'},
   'user@gmail.com':{email:'user@gmail.com',role:'user',name:'Alex Nguyen'},
  }
  const base=accounts[email.trim().toLowerCase()]
  if(!base||password!=='123456'){setError('Email hoặc mật khẩu không chính xác.');return}
  const acc={...base,...readJSON<Partial<Account>>(profileKey(base.email),{}),email:base.email,role:base.role}
  const accountCart=readArray<CartItem>(personalKey('mc-cart',acc))
  const nextCart=user?syncCart(accountCart,products):mergeCarts(cart,accountCart,products)
  const accountWishlist=readArray<number>(personalKey('mc-wishlist',acc))
  const nextWishlist=[...new Set([...(user?[]:wishlist),...accountWishlist])].filter(id=>products.some(product=>product.id===id))
  localStorage.setItem('mc-user',JSON.stringify(acc))
  writeJSON(personalKey('mc-cart',acc),nextCart);writeJSON(personalKey('mc-wishlist',acc),nextWishlist)
  setUser(acc);setCart(nextCart);setWishlist(nextWishlist);setLogin(false);setError('')
  const destination=acc.role==='admin'?'/admin':page==='admin'?'/':pathname!=='/dang-nhap'?pathname:loginReturnTo
  router.replace(destination||'/')
  flash(acc.role==='admin'?'Đã đăng nhập quản trị':'Đã đăng nhập')
 }
 const logout=()=>{
  localStorage.removeItem('mc-user')
  setUser(null);loadFor(null);setLastOrder(null)
  router.replace('/');setPage('home');flash('Đã đăng xuất')
 }

 const myOrders=useMemo(()=>orders.filter(o=>o.customerEmail===(user?.email??'__none__')),[orders,user])

 if(!ready)return <div className="app-loading"><span className="shop-logo"><span><ShoppingBag size={20}/></span>minimart</span><i/></div>
 if(page==='admin'&&user?.role==='user')return <AccessDenied home={()=>router.replace('/')} logout={logout}/>
 if(login||page==='login'||page==='admin'&&!user||!user&&['orders','profile'].includes(page))return <Login email={email} password={password} setEmail={setEmail} setPassword={setPassword} setError={setError} error={error} onSubmit={doLogin} close={()=>router.push(loginReturnTo||'/')}/>
 if(user?.role==='admin'&&page==='admin')return <Admin products={products} setProducts={setProducts} orders={orders} setOrders={saveOrders} logout={logout} toast={toast}/>
 return <div className="storefront">
  {toast&&<div className="store-toast"><Check size={16}/>{toast}</div>}
  <div className="store-nav-shell">
   <Header cart={cart} query={query} setQuery={setQuery} onSearch={()=>{setCategory('Tất cả');navigate('products')}} login={()=>openLogin('/')} logout={logout} user={user} navigate={navigate} mobile={()=>setMobile(true)}/>
   <div className="category-bar">{categories.map(c=><button className={category===c?'active':''} key={c} onClick={()=>{setQuery('');setCategory(c);navigate('products')}}>{c}</button>)}</div>
  </div>
  {mobile&&<MobileNav close={()=>setMobile(false)} navigate={navigate} user={user} login={()=>openLogin('/')} logout={logout}/>}
  {page==='home'&&<Home navigate={navigate} add={add} products={products} open={openProduct} setCategory={setCategory} setQuery={setQuery}/>}
  {page==='products'&&<Products products={products} query={query} setQuery={setQuery} category={category} setCategory={setCategory} add={add} wishlist={wishlist} toggleWish={toggleWish} open={openProduct}/>}
  {page==='detail'&&(selected?<Detail product={selected} add={add} wishlist={wishlist} toggleWish={toggleWish} navigate={navigate} setCategory={setCategory} setQuery={setQuery}/>:<main className="section"><Empty text="Sản phẩm không tồn tại hoặc đã bị xóa." action="Về danh sách sản phẩm" onClick={()=>navigate('products')}/></main>)}
  {page==='cart'&&<Cart cart={syncCart(cart,products)} saveCart={saveCart} navigate={navigate}/>}
  {page==='checkout'&&<Checkout cart={syncCart(cart,products)} saveCart={saveCart} orders={orders} saveOrders={saveOrders} products={products} saveProducts={saveProducts} user={user} navigate={navigate} requireLogin={()=>openLogin('/thanh-toan')} onDone={(o:Order)=>{setLastOrder(o)}}/>}
  {page==='success'&&<Success navigate={navigate} order={lastOrder||myOrders[0]}/>}
  {page==='orders'&&<Orders orders={myOrders} navigate={navigate}/>}
  {page==='wishlist'&&<Wishlist products={products} wishlist={wishlist} toggleWish={toggleWish} add={add} open={openProduct}/>}
  {page==='profile'&&<Profile user={user} setUser={setUser} logout={logout} navigate={navigate}/>}
  <Footer/>
 </div>
}

function Header({cart,query,setQuery,onSearch,login,logout,user,navigate,mobile}:any){
 return <header className="shop-header">
  <button className="mobile-trigger" onClick={mobile}><Menu/></button>
  <button className="shop-logo" onClick={()=>navigate('home')}><span><ShoppingBag size={20}/></span>minimart</button>
  <div className="shop-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onSearch()} placeholder="Tìm sản phẩm hoặc danh mục..."/><button onClick={onSearch}>Tìm kiếm</button></div>
  <nav className="shop-actions">
   <button onClick={()=>navigate('wishlist')} aria-label="Sản phẩm yêu thích"><Heart size={20}/></button>
   <button onClick={()=>navigate('cart')} className="cart-btn" aria-label="Giỏ hàng"><ShoppingBag size={20}/>{cart.length>0&&<i>{itemCount(cart)}</i>}</button>
   {user?.role==='user'&&<button className="account-btn order-link" onClick={()=>navigate('orders')} title="Xem đơn hàng đã đặt" aria-label="Xem đơn hàng đã đặt"><Package size={18}/><span>Đơn hàng</span></button>}
   {user
    ?<><button className="account-btn" onClick={()=>navigate(user.role==='admin'?'admin':'profile')}><User size={18}/><span>{user.role==='admin'?'Quản trị':user.name.split(' ')[0]}</span></button><button className="account-btn" onClick={logout} title="Đăng xuất" aria-label="Đăng xuất"><LogOut size={18}/></button></>
    :<button className="account-btn" onClick={login}><User size={18}/><span>Đăng nhập</span></button>}
  </nav>
 </header>
}
function MobileNav({close,navigate,user,login,logout}:any){
 useEffect(()=>{const before=document.body.style.overflow;const onResize=()=>{if(window.innerWidth>800)close()};document.body.style.overflow='hidden';window.addEventListener('resize',onResize);return()=>{document.body.style.overflow=before;window.removeEventListener('resize',onResize)}},[close])
 return <div className="mobile-nav-layer">
  <button className="mobile-nav-backdrop" aria-label="Đóng menu" onClick={close}/>
  <nav className="mobile-nav" aria-label="Điều hướng di động">
   <button aria-label="Đóng menu" onClick={close}><X/></button>
   {[['home','Trang chủ'],['products','Sản phẩm'],['orders','Đơn hàng'],['wishlist','Yêu thích'],[user?.role==='admin'?'admin':'profile',user?.role==='admin'?'Quản trị':'Tài khoản']].map(([value,label])=><button key={value} onClick={()=>navigate(value)}>{label}</button>)}
   {user
    ?<button onClick={logout}><LogOut size={16}/> Đăng xuất ({user.name})</button>
    :<button onClick={login}><User size={16}/> Đăng nhập</button>}
  </nav>
 </div>
}
function Home({navigate,add,products,open,setCategory,setQuery}:any){
 const openCatalog=(nextCategory:string='Tất cả')=>{setQuery('');setCategory(nextCategory);navigate('products')}
 const selectProducts=(ids:number[])=>ids.map(id=>products.find((product:Product)=>product.id===id)).filter(Boolean)
 const featured=selectProducts([1,10,18,27])
 const newArrivals=selectProducts([35,43,2,30])
 const heroProduct=products.find((product:Product)=>product.id===10)||products[0]||productSeed[0]
 return <main>
  <section className="hero">
   <div>
    <p className="eyebrow">BỘ SƯU TẬP MỚI · 2026</p>
    <h1>Chọn điều bạn thích.<br/><em>Sống theo cách riêng.</em></h1>
    <p>Sản phẩm được tuyển chọn cho công việc, ngôi nhà và nhịp sống mỗi ngày. Chất lượng rõ ràng, giao hàng tận nơi.</p>
    <button className="hero-btn" onClick={()=>openCatalog()}>Khám phá ngay <ArrowRight size={17}/></button>
   </div>
   <div className="hero-card"><img src={heroProduct.image} alt={heroProduct.name}/><div><strong>Hàng mới về</strong><span>Ưu đãi đến 20%</span></div></div>
  </section>
  <section className="section category-cards">
   <div className="section-heading">
    <div><p className="eyebrow">MUA THEO DANH MỤC</p><h2>Mỗi lựa chọn, một phong cách</h2></div>
    <button className="link-btn" onClick={()=>openCatalog()}>Xem tất cả <ArrowRight size={15}/></button>
   </div>
   <div className="category-grid">{['Điện tử','Thời trang','Giày dép','Nhà cửa'].map((c,i)=><button key={c} onClick={()=>openCatalog(c)} className={`cat-card cat-${i}`}><span>{c}</span><small>Khám phá bộ sưu tập <ArrowRight size={13}/></small></button>)}</div>
  </section>
  <ProductSection title="Sản phẩm nổi bật" products={featured.length===4?featured:products.slice(0,4)} add={add} viewAll={()=>openCatalog()} open={open}/>
  <ProductSection title="Hàng mới về" products={newArrivals.length===4?newArrivals:products.slice(4,8)} add={add} viewAll={()=>openCatalog()} open={open}/>
 </main>
}
function ProductSection({title,products,add,viewAll,open}:any){
 return <section className="section">
  <div className="section-heading">
   <div><p className="eyebrow">CHỌN RIÊNG CHO BẠN</p><h2>{title}</h2></div>
   <button className="link-btn" onClick={viewAll}>Xem tất cả <ArrowRight size={15}/></button>
  </div>
  <div className="product-grid">{products.map((p:Product)=><ProductCard key={p.id} product={p} add={add} open={()=>open(p)}/>)}</div>
 </section>
}
function ProductCard({product,add,open,wishlist,toggleWish}:any){
 return <article className="product-card">
  <button className="product-image" onClick={open}><img src={product.image} alt={product.name} onError={e=>{e.currentTarget.src='/placeholder.jpg'}}/>{product.badge&&<span className="badge">{product.badge}</span>}</button>
  {toggleWish&&<button className="wish-btn" aria-label={wishlist?.includes(product.id)?`Bỏ ${product.name} khỏi yêu thích`:`Thêm ${product.name} vào yêu thích`} onClick={()=>toggleWish(product.id)}><Heart size={17} fill={wishlist?.includes(product.id)?'currentColor':'none'}/></button>}
  <div className="product-info">
   <p>{categoryLabel(product.category)}</p><h3>{product.name}</h3>
   <div className="rating"><Star size={14} fill="currentColor"/> {product.rating} <span>({product.sold})</span></div>
   <div className="price-row"><strong>{money(product.sale)}</strong>{product.price>product.sale&&<del>{money(product.price)}</del>}</div>
   <button className="add-btn" disabled={product.stock<=0} onClick={()=>add(product)}>{product.stock>0?'Thêm vào giỏ':'Tạm hết hàng'} <Plus size={15}/></button>
  </div>
 </article>
}
function Products({products,query,setQuery,category,setCategory,add,wishlist,toggleWish,open}:any){
 const [sort,setSort]=useState('popular')
 const filtered=useMemo(()=>{
  const needle=query.trim().toLocaleLowerCase('vi')
  let arr=products.filter((p:Product)=>(p.name+categoryLabel(p.category)).toLocaleLowerCase('vi').includes(needle)&&(category==='Tất cả'||category===categoryLabel(p.category)||category==='Điện tử'&&['Smartphones','Laptops'].includes(p.category)))
  if(sort==='low')arr=[...arr].sort((a:Product,b:Product)=>a.sale-b.sale)
  if(sort==='high')arr=[...arr].sort((a:Product,b:Product)=>b.sale-a.sale)
  if(sort==='rating')arr=[...arr].sort((a:Product,b:Product)=>b.rating-a.rating)
  if(sort==='popular')arr=[...arr].sort((a:Product,b:Product)=>b.sold-a.sold)
  return arr
 },[products,query,category,sort])
 return <main className="listing section">
  <div className="crumb">Trang chủ <ChevronRight size={14}/> Sản phẩm</div>
  <div className="listing-head">
   <div><p className="eyebrow">DANH MỤC SẢN PHẨM</p><h1>{query?`Kết quả cho “${query}”`:'Tất cả sản phẩm'}</h1><p>Tìm thấy {filtered.length} sản phẩm</p></div>
   <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sắp xếp"><option value="popular">Phổ biến nhất</option><option value="rating">Đánh giá cao</option><option value="low">Giá thấp đến cao</option><option value="high">Giá cao đến thấp</option></select>
  </div>
  <div className="filter-pills">{categories.map(c=><button className={category===c?'selected':''} key={c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
  {filtered.length?<div className="product-grid wide">{filtered.map((p:Product)=><ProductCard key={p.id} product={p} add={add} wishlist={wishlist} toggleWish={toggleWish} open={()=>open(p)}/>)}</div>:<Empty text="Không tìm thấy sản phẩm phù hợp." action="Xóa bộ lọc" onClick={()=>{setQuery('');setCategory('Tất cả')}}/>}
 </main>
}
function Detail({product,add,wishlist,toggleWish,navigate,setCategory,setQuery}:any){
 const [qty,setQty]=useState(1)
 return <main className="detail section">
  <div className="crumb"><button onClick={()=>navigate('home')}>Trang chủ</button> <ChevronRight size={14}/> <button onClick={()=>{setQuery('');setCategory(categoryLabel(product.category));navigate('products')}}>{categoryLabel(product.category)}</button> <ChevronRight size={14}/> {product.name}</div>
  <div className="detail-grid">
   <div className="detail-image"><img src={product.image} alt={product.name}/></div>
   <div className="detail-copy">
    <p className="eyebrow">{categoryLabel(product.category)}</p>
    <h1>{product.name}</h1>
    <div className="detail-rating"><Star size={16} fill="currentColor"/> {product.rating} <span>· đã bán {product.sold}</span></div>
    <div className="detail-price"><strong>{money(product.sale)}</strong>{product.price>product.sale&&<><del>{money(product.price)}</del><b>GIẢM {Math.round((1-product.sale/product.price)*100)}%</b></>}</div>
    <p className="description">{product.description}</p>
    <p className="stock"><Check size={16}/> {product.stock>0?`Còn ${product.stock} sản phẩm · Sẵn sàng giao`:'Tạm hết hàng'}</p>
    <div className="quantity"><button aria-label="Giảm số lượng" disabled={qty<=1} onClick={()=>setQty(Math.max(1,qty-1))}>−</button><b>{qty}</b><button aria-label="Tăng số lượng" disabled={qty>=product.stock} onClick={()=>setQty(Math.min(product.stock,qty+1))}>+</button></div>
    <div className="detail-actions">
     <button className="hero-btn" disabled={product.stock<=0} onClick={()=>add(product,qty)}>Thêm vào giỏ <ShoppingBag size={17}/></button>
     <button className="outline-btn" onClick={()=>toggleWish(product.id)}><Heart size={18} fill={wishlist.includes(product.id)?'currentColor':'none'}/></button>
    </div>
   </div>
  </div>
  <div className="info-tabs">
   <h2>Thông tin sản phẩm</h2>
   <p>{product.description} Sản phẩm được tuyển chọn dựa trên chất lượng, tính tiện dụng và thiết kế bền vững.</p>
   <div className="spec-grid"><span>Chất lượng <b>Tiêu chuẩn cao cấp</b></span><span>Bảo hành <b>12 tháng</b></span><span>Giao hàng <b>2–4 ngày làm việc</b></span></div>
  </div>
 </main>
}
function Cart({cart,saveCart,navigate}:any){
 const subtotal=cart.reduce((a:number,x:CartItem)=>a+x.sale*x.quantity,0)
 return <main className="section cart-page">
  <p className="eyebrow">GIỎ HÀNG CỦA BẠN</p><h1>Giỏ hàng</h1>
  {!cart.length
   ?<Empty text="Giỏ hàng đang chờ những món đồ bạn yêu thích." action="Bắt đầu mua sắm" onClick={()=>navigate('products')}/>
   :<div className="cart-grid">
    <div className="cart-list">{cart.map((x:CartItem)=>
     <div className="cart-item" key={x.id}>
      <img src={x.image} alt={x.name}/>
      <div><p>{x.category}</p><h3>{x.name}</h3><strong>{money(x.sale)}</strong></div>
      <div className="quantity">
       <button aria-label={`Giảm số lượng ${x.name}`} disabled={x.quantity<=1} onClick={()=>saveCart(cart.map((c:CartItem)=>c.id===x.id?{...c,quantity:Math.max(1,c.quantity-1)}:c))}>−</button>
       <b>{x.quantity}</b>
       <button aria-label={`Tăng số lượng ${x.name}`} disabled={x.quantity>=x.stock} onClick={()=>saveCart(cart.map((c:CartItem)=>c.id===x.id?{...c,quantity:Math.min(x.stock,c.quantity+1)}:c))}>+</button>
      </div>
      <button className="remove" aria-label={`Xóa ${x.name} khỏi giỏ`} onClick={()=>saveCart(cart.filter((c:CartItem)=>c.id!==x.id))}><Trash2 size={17}/></button>
     </div>)}
    </div>
    <Summary subtotal={subtotal} navigate={navigate}/>
   </div>}
 </main>
}
function Summary({subtotal,navigate,checkout=false}:any){
 const shipping=shippingFee(subtotal)
 return <aside className="summary">
  <h3>Tóm tắt đơn hàng</h3>
  <p><span>Tạm tính</span><b>{money(subtotal)}</b></p>
  <p><span>Phí giao hàng</span><b>{shipping?money(shipping):'Miễn phí'}</b></p>
  {subtotal>0&&subtotal<10_000_000&&<small>Mua thêm {money(10_000_000-subtotal)} để được miễn phí giao hàng.</small>}
  <hr/>
  <p className="total"><span>Tổng cộng</span><b>{money(subtotal+shipping)}</b></p>
  {!checkout&&<button className="hero-btn full" onClick={()=>navigate('checkout')}>Tiến hành thanh toán <ArrowRight size={16}/></button>}
 </aside>
}
function Checkout({cart,saveCart,orders,saveOrders,products,saveProducts,user,navigate,requireLogin,onDone}:any){
 const [form,setForm]=useState({name:user?.name||'',phone:user?.phone||'',email:user?.email||'',address:user?.address||'',note:'',payment:'Thanh toán khi nhận hàng'})
 const [submitError,setSubmitError]=useState('')
 const [placing,setPlacing]=useState(false)
 const subtotal=cart.reduce((a:number,x:CartItem)=>a+x.sale*x.quantity,0)
 // Checkout requires an account so each order belongs to exactly one user
 if(!user)return <main className="section checkout checkout-gate"><p className="eyebrow">THANH TOÁN</p><h1>Đăng nhập để tiếp tục</h1><p>Đơn hàng cần được gắn với tài khoản để bạn theo dõi trạng thái và lịch sử mua sắm.</p><div><button className="hero-btn" onClick={requireLogin}>Đăng nhập ngay</button><button className="outline-btn" onClick={()=>navigate('cart')}>Quay lại giỏ hàng</button></div></main>
 if(!cart.length)return <main className="section checkout"><p className="eyebrow">THANH TOÁN</p><h1>Giỏ hàng đang trống</h1><div><button className="hero-btn" onClick={()=>navigate('products')}>Tiếp tục mua sắm</button></div></main>
 const submit=(e:any)=>{
  e.preventDefault()
  if(placing)return
  setPlacing(true);setSubmitError('')
  const unavailable=cart.find((item:CartItem)=>(products.find((p:Product)=>p.id===item.id)?.stock||0)<item.quantity)
  if(unavailable){setSubmitError(`${unavailable.name} không còn đủ số lượng. Vui lòng cập nhật giỏ hàng.`);setPlacing(false);return}
  const now=new Date()
  const order:Order={id:'#MM-'+Date.now().toString().slice(-8),date:now.toLocaleDateString('vi-VN'),createdAt:now.toISOString(),items:cart,total:subtotal+shippingFee(subtotal),payment:form.payment,status:'Chờ xác nhận',customer:form.name.trim(),customerEmail:user.email,phone:form.phone.trim(),address:form.address.trim(),note:form.note.trim()}
  // Deduct stock from the shared catalog
  saveProducts(products.map((p:Product)=>{const bought=cart.filter((x:CartItem)=>x.id===p.id).reduce((a:number,x:CartItem)=>a+x.quantity,0);return bought?{...p,stock:Math.max(0,p.stock-bought),sold:p.sold+bought}:p}))
  saveOrders([order,...orders])
  saveCart([])
  onDone(order)
  navigate('success')
 }
 return <main className="section checkout">
  <div>
   <p className="eyebrow">THANH TOÁN</p><h1>Hoàn tất đơn hàng</h1>
   <form className="checkout-form" onSubmit={submit}>
    <h3>Thông tin giao hàng</h3>
    <div className="form-two">
     <label>Họ và tên<input required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
     <label>Số điện thoại<input required pattern="[0-9+ ]{9,15}" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
    </div>
    <label>Email<input required type="email" value={form.email} disabled/></label>
    <label>Địa chỉ nhận hàng<input required minLength={8} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
    <label>Ghi chú<textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Ví dụ: giao trong giờ hành chính"/></label>
    <h3>Phương thức thanh toán</h3>
    <label className="radio"><input type="radio" name="payment" checked readOnly/>Thanh toán khi nhận hàng</label>
    <label className="radio payment-disabled"><input type="radio" name="payment" disabled/>Chuyển khoản ngân hàng <small>Sắp hỗ trợ</small></label>
    <label className="radio payment-disabled"><input type="radio" name="payment" disabled/>Thẻ tín dụng <small>Sắp hỗ trợ</small></label>
    {submitError&&<p className="form-error">{submitError}</p>}
    <button className="hero-btn full" disabled={placing}>{placing?'Đang xử lý...':'Đặt hàng'} {!placing&&<ArrowRight size={16}/>}</button>
   </form>
  </div>
  <Summary subtotal={subtotal} navigate={navigate} checkout/>
 </main>
}
function Success({navigate,order}:any){
 if(!order)return <main className="section"><Empty text="Không tìm thấy đơn hàng vừa đặt." action="Về trang sản phẩm" onClick={()=>navigate('products')}/></main>
 return <main className="success-page section">
  <div className="success-icon"><Check size={35}/></div>
  <p className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</p>
  <h1>Cảm ơn bạn đã mua sắm.</h1>
  <p>Trạng thái đơn hàng sẽ được cập nhật trong tài khoản của bạn.</p>
  <div className="success-card">
   <span>Mã đơn hàng <b>{order?.id||'—'}</b></span>
   <span>Tổng cộng <b>{money(order?.total||0)}</b></span>
   <span>Thanh toán <b>{order?.payment||'—'}</b></span>
  </div>
  <div>
   <button className="hero-btn" onClick={()=>navigate('orders')}>Xem đơn hàng</button>
   <button className="outline-btn" onClick={()=>navigate('products')}>Tiếp tục mua sắm</button>
  </div>
 </main>
}
function Orders({orders,navigate}:any){
 const [expanded,setExpanded]=useState<string|null>(null)
 return <main className="section">
  <p className="eyebrow">TÀI KHOẢN</p><h1>Đơn hàng của tôi</h1>
  <div className="order-list">
   {orders.length
    ?orders.map((o:Order)=><article className="order-entry" key={o.id}>
     <button className="order-card" onClick={()=>setExpanded(expanded===o.id?null:o.id)} aria-expanded={expanded===o.id}>
      <div><strong>{o.id}</strong><span>{o.date} · {itemCount(o.items)} sản phẩm</span></div>
      <b>{money(o.total)}</b>
      <span className={`order-status ${statusSlug(o.status)}`}><Truck size={15}/>{o.status}</span>
     </button>
     {expanded===o.id&&<div className="order-detail"><div><b>Giao đến</b><span>{o.customer}{o.phone?` · ${o.phone}`:''}</span><span>{o.address}</span></div><div>{o.items.map(item=><span key={item.id}>{item.name} × {item.quantity}<b>{money(item.sale*item.quantity)}</b></span>)}</div><p><span>Thanh toán</span><b>{o.payment}</b></p></div>}
    </article>)
    :<Empty text="Bạn chưa có đơn hàng nào." action="Khám phá sản phẩm" onClick={()=>navigate('products')}/>}
  </div>
 </main>
}
function Wishlist({products,wishlist,toggleWish,add,open,navigate}:any){
 const items=products.filter((p:Product)=>wishlist.includes(p.id))
 return <main className="section">
  <p className="eyebrow">ĐÃ LƯU CHO LẦN SAU</p><h1>Sản phẩm yêu thích</h1>
  {items.length
   ?<div className="product-grid">{items.map((p:Product)=><ProductCard key={p.id} product={p} add={add} wishlist={wishlist} toggleWish={toggleWish} open={()=>open(p)}/>)}</div>
   :<Empty text="Lưu sản phẩm bạn thích để dễ dàng tìm lại." action="Xem sản phẩm" onClick={()=>navigate('products')}/>}
 </main>
}

function Profile({user,setUser,logout,navigate}:any){
 const [saved,setSaved]=useState(false)
 const [form,setForm]=useState({name:user?.name||'',email:user?.email||'',phone:user?.phone||'',address:user?.address||''})
 const save=(e:any)=>{
  e.preventDefault()
  const next={...user,name:form.name.trim(),phone:form.phone.trim(),address:form.address.trim()}
  setUser(next);localStorage.setItem('mc-user',JSON.stringify(next));writeJSON(profileKey(next.email),next);setSaved(true)
  window.setTimeout(()=>setSaved(false),1800)
 }
 return <main className="section profile-page">
  <p className="eyebrow">THIẾT LẬP TÀI KHOẢN</p><h1>Hồ sơ của tôi</h1>
  <div className="profile-card">
   <div className="profile-avatar">{form.name.trim().split(/\s+/).filter(Boolean).slice(0,2).map((x:string)=>x[0]?.toUpperCase()).join('')||'U'}</div>
   <h2>{form.name}</h2><p>{form.email}</p>
  </div>
  <form className="profile-form" onSubmit={save}>
   <label>Họ và tên<input required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label>Email<input value={form.email} disabled/></label>
   <label>Số điện thoại<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
   <label>Địa chỉ mặc định<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
   <button className="hero-btn">{saved?'Đã lưu':'Lưu thay đổi'}</button>
  </form>
  <div className="profile-actions">
   <button className="hero-btn" onClick={()=>navigate('orders')}><Package size={17}/> Xem đơn hàng đã đặt</button>
   <button className="outline-btn" onClick={logout}><LogOut size={17}/> Đăng xuất</button>
  </div>
 </main>
}
function Empty({text,action,onClick}:any){
 return <div className="empty"><ShoppingBag size={32}/><p>{text}</p><button className="hero-btn" onClick={onClick}>{action}</button></div>
}
function Footer(){
 return <footer>
  <div><div className="shop-logo"><span><ShoppingBag size={18}/></span>minimart</div><p>Những lựa chọn tinh gọn cho cuộc sống mỗi ngày.</p></div>
  <div><b>Mua sắm</b><span>Hàng mới về</span><span>Sản phẩm bán chạy</span></div>
  <div><b>Hỗ trợ</b><span>Giao hàng & đổi trả</span><span>Liên hệ</span></div>
  <div><b>Kết nối</b><span>Instagram · Facebook</span></div>
 </footer>
}
function Login({email,password,setEmail,setPassword,setError,error,onSubmit,close}:any){
 return <main className="auth-page">
  <button className="auth-close" onClick={close}><X/></button>
  <div className="auth-art">
   <span className="shop-logo"><span><ShoppingBag size={20}/></span>minimart</span>
   <div>
    <p className="eyebrow">CHÀO MỪNG ĐẾN MINIMART</p>
    <h1>Mỗi món đồ tốt,<br/><em>mỗi ngày đẹp hơn.</em></h1>
    <p>Không gian mua sắm được tuyển chọn cho những điều làm cuộc sống hàng ngày trở nên dễ dàng hơn.</p>
   </div>
  </div>
  <form className="auth-form" onSubmit={onSubmit}>
   <p className="eyebrow">TÀI KHOẢN CỦA BẠN</p>
   <h2>Chào mừng trở lại</h2>
   <p>Đăng nhập để tiếp tục mua sắm.</p>
   <label>Địa chỉ email<input required type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setError('')}} placeholder="ban@example.com"/></label>
   <label>Mật khẩu<input required type="password" autoComplete="current-password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}} placeholder="••••••••"/></label>
   {error&&<small className="error">{error}</small>}
   <button className="hero-btn full">Đăng nhập <ArrowRight size={16}/></button>
   <small className="demo">Demo: user@gmail.com (khách hàng) hoặc admin@gmail.com (quản trị) · mật khẩu 123456</small>
  </form>
 </main>
}

function AccessDenied({home,logout}:any){
 return <main className="access-denied">
  <div className="success-icon"><X size={30}/></div>
  <p className="eyebrow">KHÔNG CÓ QUYỀN TRUY CẬP</p>
  <h1>Khu vực dành cho quản trị viên</h1>
  <p>Tài khoản hiện tại không có quyền mở trang này.</p>
  <div><button className="hero-btn" onClick={home}>Về cửa hàng</button><button className="outline-btn" onClick={logout}><LogOut size={16}/> Đổi tài khoản</button></div>
 </main>
}

function Admin({products,setProducts,orders,setOrders,logout,toast}:any){
 const router=useRouter(),pathname=usePathname()
 const tabFromPath=pathname==='/admin/san-pham'?'Products':pathname==='/admin/don-hang'?'Orders':pathname==='/admin/khach-hang'?'Customers':'Dashboard'
 const [tab,setTab]=useState(tabFromPath)
 useEffect(()=>setTab(tabFromPath),[tabFromPath])
 const [modal,setModal]=useState(false)
 const [edit,setEdit]=useState<Product|null>(null)
 const save=(p:Product)=>{
  const next=edit?products.map((x:Product)=>x.id===p.id?p:x):[p,...products]
  setProducts(next);writeJSON('mc-products',next);setModal(false)
 }
 const updateStatus=(id:string,status:string)=>{
  const order=orders.find((item:Order)=>item.id===id)
  if(!order||order.status===status||!orderTransitions[order.status]?.includes(status))return
  if(status==='Đã hủy'){
   const restored=products.map((product:Product)=>{
    const quantity=order.items.filter((item:CartItem)=>item.id===product.id).reduce((sum:number,item:CartItem)=>sum+item.quantity,0)
    return quantity?{...product,stock:product.stock+quantity,sold:Math.max(0,product.sold-quantity)}:product
   })
   setProducts(restored);writeJSON('mc-products',restored)
  }
  setOrders(orders.map((item:Order)=>item.id===id?{...item,status}:item))
 }
 return <div className="admin-app">
  {toast&&<div className="store-toast"><Check size={16}/>{toast}</div>}
  <aside className="admin-side">
   <button className="shop-logo" onClick={()=>router.push('/admin')}><span><ShoppingBag size={18}/></span>minimart</button>
   <p className="admin-label">TRUNG TÂM QUẢN TRỊ</p>
   {[['Dashboard','Tổng quan','/admin'],['Products','Sản phẩm','/admin/san-pham'],['Orders','Đơn hàng','/admin/don-hang'],['Customers','Khách hàng','/admin/khach-hang']].map(([value,label,path],index)=><button className={tab===value?'active':''} onClick={()=>{setTab(value);router.push(path)}} key={value}>{index===0?<LayoutDashboard size={17}/>:index===1?<Package size={17}/>:index===2?<Truck size={17}/>:<Users size={17}/>}<span>{label}</span></button>)}
   <button className="admin-logout" onClick={logout}><LogOut size={17}/><span>Đăng xuất</span></button>
  </aside>
  <main className="admin-main">
   <header><div><p className="eyebrow">MINIMART ADMIN</p><h1>{adminTitles[tab]||tab}</h1></div><span className="admin-avatar">AD</span></header>
   {tab==='Dashboard'&&<AdminDashboard products={products} orders={orders}/>}
   {tab==='Products'&&<AdminProducts products={products} setEdit={setEdit} setModal={setModal} deleteProduct={(id:number)=>{if(!window.confirm('Xóa sản phẩm này khỏi danh mục?'))return;const next=products.filter((p:Product)=>p.id!==id);setProducts(next);writeJSON('mc-products',next)}}/>}
   {tab==='Orders'&&<AdminOrders orders={orders} updateStatus={updateStatus}/>}
   {tab==='Customers'&&<AdminCustomers orders={orders}/>}
  </main>
  {modal&&<AdminForm product={edit} close={()=>setModal(false)} save={save}/>}
 </div>
}
function AdminDashboard({products,orders}:any){
 const revenue=orders.filter((o:Order)=>['Completed','Hoàn thành'].includes(o.status)).reduce((a:number,o:Order)=>a+o.total,0)
 const lowStock=products.filter((p:Product)=>p.stock<=5).length
 const inventory=products.slice(0,7),maxStock=Math.max(1,...inventory.map((p:Product)=>p.stock))
 return <div className="admin-content">
  <div className="admin-stats">
   <div><span>Doanh thu</span><strong>{money(revenue)}</strong><small><CircleDollarSign size={13}/> Đơn hoàn thành</small></div>
   <div><span>Đơn hàng</span><strong>{orders.length}</strong><small><Truck size={13}/> Toàn cửa hàng</small></div>
   <div><span>Sản phẩm</span><strong>{products.length}</strong><small><Package size={13}/> {lowStock} sắp hết</small></div>
   <div><span>Khách hàng</span><strong>{new Set(orders.map((o:Order)=>o.customerEmail)).size}</strong><small><Users size={13}/> Đã mua hàng</small></div>
  </div>
  <div className="admin-grid">
   <section className="admin-panel"><h3>Tồn kho theo sản phẩm</h3>{inventory.length?<><div className="fake-chart">{inventory.map((product:Product)=><i key={product.id} style={{height:`${Math.max(5,product.stock/maxStock*100)}%`}} title={`${product.name}: ${product.stock}`}/>)}</div><div className="chart-labels">{inventory.map((product:Product)=><span key={product.id} title={product.name}>{product.name.slice(0,7)}</span>)}</div></>:<p className="muted">Chưa có dữ liệu sản phẩm.</p>}</section>
   <section className="admin-panel"><h3>Đơn hàng gần đây</h3>
    {orders.slice(0,4).map((o:Order)=><div className="admin-order" key={o.id}><span>{o.customer} · {o.customerEmail}</span><b>{money(o.total)}</b><small>{o.status}</small></div>)}
    {!orders.length&&<p style={{color:'#999'}}>Chưa có đơn hàng nào.</p>}
   </section>
  </div>
 </div>
}
function AdminProducts({products,setEdit,setModal,deleteProduct}:any){
 const [search,setSearch]=useState('')
 const rows=products.filter((p:Product)=>(p.name+p.category).toLowerCase().includes(search.toLowerCase()))
 return <div className="admin-content">
  <div className="admin-toolbar"><div><p>Quản lý danh mục và tồn kho.</p><div className="table-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm sản phẩm..."/></div></div><button className="hero-btn" onClick={()=>{setEdit(null);setModal(true)}}><Plus size={16}/> Thêm sản phẩm</button></div>
  <div className="admin-table"><table>
   <thead><tr><th>SẢN PHẨM</th><th>DANH MỤC</th><th>GIÁ BÁN</th><th>TỒN KHO</th><th>TRẠNG THÁI</th><th/></tr></thead>
   <tbody>{rows.map((p:Product)=>
    <tr key={p.id}>
     <td><img src={p.image} alt=""/><b>{p.name}</b></td>
     <td>{categoryLabel(p.category)}</td>
     <td>{money(p.sale)}</td>
     <td>{p.stock}</td>
     <td><span className={`table-status ${p.stock<=0?'danger':p.stock<=5?'warning':''}`}>{p.stock<=0?'Hết hàng':p.stock<=5?'Sắp hết':'Đang bán'}</span></td>
     <td><button onClick={()=>{setEdit(p);setModal(true)}}><Pencil size={15}/></button><button onClick={()=>deleteProduct(p.id)}><Trash2 size={15}/></button></td>
    </tr>)}{!rows.length&&<tr><td colSpan={6} className="table-empty">Không tìm thấy sản phẩm phù hợp.</td></tr>}
   </tbody>
  </table></div>
 </div>
}
function AdminOrders({orders,updateStatus}:any){
 const [filter,setFilter]=useState('Tất cả')
 const rows=filter==='Tất cả'?orders:orders.filter((o:Order)=>o.status===filter)
 return <div className="admin-content">
  <div className="admin-toolbar"><div><p>Theo dõi và xử lý đơn hàng.</p></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Tất cả</option><option>Chờ xác nhận</option><option>Đang xử lý</option><option>Đang giao</option><option>Hoàn thành</option><option>Đã hủy</option></select></div>
  <div className="admin-table"><table>
   <thead><tr><th>MÃ ĐƠN</th><th>KHÁCH HÀNG</th><th>TỔNG TIỀN</th><th>THANH TOÁN</th><th>TRẠNG THÁI</th></tr></thead>
   <tbody>{rows.map((o:Order)=>
    <tr key={o.id}>
     <td><b>{o.id}</b></td>
     <td>{o.customer}<small>{o.customerEmail}</small></td>
     <td>{money(o.total)}</td>
     <td>{o.payment}</td>
     <td><select disabled={!orderTransitions[o.status]?.length} value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}><option value={o.status}>{o.status}</option>{orderTransitions[o.status]?.map(status=><option key={status}>{status}</option>)}</select></td>
    </tr>)}{!rows.length&&<tr><td colSpan={5} className="table-empty">Không có đơn hàng ở trạng thái này.</td></tr>}
   </tbody>
  </table></div>
 </div>
}
function AdminCustomers({orders}:any){
 const byEmail=new Map<string,{name:string;count:number;spent:number}>()
 orders.forEach((o:Order)=>{
  const cur=byEmail.get(o.customerEmail)||{name:o.customer,count:0,spent:0}
  byEmail.set(o.customerEmail,{name:o.customer,count:cur.count+1,spent:cur.spent+(['Completed','Hoàn thành'].includes(o.status)?o.total:0)})
 })
 const rows=[...byEmail.entries()]
 return <div className="admin-content">
  <p>Giá trị vòng đời khách hàng từ dữ liệu đơn thực tế.</p>
  <div className="admin-table"><table>
   <thead><tr><th>KHÁCH HÀNG</th><th>ĐƠN HÀNG</th><th>TỔNG CHI TIÊU</th><th>TRẠNG THÁI</th></tr></thead>
   <tbody>
    {rows.length?rows.map(([email,c])=>
     <tr key={email}>
      <td><b>{c.name}</b><small>{email}</small></td>
      <td>{c.count}</td>
      <td>{money(c.spent)}</td>
      <td><span className="table-status">Đang hoạt động</span></td>
     </tr>)
    :<tr><td colSpan={4} style={{color:'#999'}}>Chưa có khách hàng nào đặt hàng.</td></tr>}
   </tbody>
  </table></div>
 </div>
}
function AdminForm({product,close,save}:any){
 const [f,setF]=useState<Product>(product||{id:Date.now(),name:'',category:'Accessories',price:0,sale:0,stock:0,rating:4.5,sold:0,image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=85',description:''})
 useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')close()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[close])
 return <div className="modal-wrap">
  <form className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title" onSubmit={e=>{e.preventDefault();save({...f,name:f.name.trim(),description:f.description.trim(),image:f.image.trim()})}}>
   <button type="button" className="modal-x" onClick={close}><X/></button>
   <h2 id="product-form-title">{product?'Chỉnh sửa sản phẩm':'Thêm sản phẩm'}</h2>
   <label>Tên sản phẩm<input required minLength={2} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label>
   <label>Danh mục<select value={f.category} onChange={e=>setF({...f,category:e.target.value as Product['category']})}>{Object.entries(categoryMap).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
   <div className="form-two"><label>Giá niêm yết<input required min={1000} step={1000} type="number" value={f.price} onChange={e=>setF({...f,price:Number(e.target.value)})}/></label><label>Giá bán<input required min={1000} step={1000} max={f.price||undefined} type="number" value={f.sale} onChange={e=>setF({...f,sale:Number(e.target.value)})}/></label></div>
   <label>Tồn kho<input required min={0} type="number" value={f.stock} onChange={e=>setF({...f,stock:Number(e.target.value)})}/></label>
   <label>Ảnh sản phẩm<input required type="url" value={f.image} onChange={e=>setF({...f,image:e.target.value})}/></label>
   <label>Mô tả<textarea required value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></label>
   <button className="hero-btn full">Lưu sản phẩm</button>
  </form>
 </div>
}
