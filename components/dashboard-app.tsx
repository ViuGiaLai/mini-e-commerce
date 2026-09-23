'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bell, Check, ChevronDown, ChevronLeft, ChevronRight, Heart, Home as HomeIcon, LayoutDashboard, LogOut, Menu, Package, Pencil, Plus, Search, ShoppingBag, Star, Trash2, Truck, User, Users, X } from 'lucide-react'

type Product = { id:number; name:string; category:string; price:number; sale:number; stock:number; rating:number; sold:number; badge?:string; image:string; description:string }
type CartItem = Product & { quantity:number }
type Order = { id:string; date:string; items:CartItem[]; total:number; payment:string; status:string; customer:string; customerEmail:string; address:string }
type Account = { email:string; role:'admin'|'user'; name:string }

const productSeed:Product[] = [
 {id:1,name:'iPhone 15 Pro',category:'Smartphones',price:28990000,sale:25990000,stock:18,rating:4.9,sold:328,badge:'Best seller',image:'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=700&q=85',description:'A17 Pro chip, titanium design and a pro camera system for incredible everyday photos.'},
 {id:2,name:'MacBook Air M3',category:'Laptops',price:32990000,sale:29990000,stock:11,rating:4.8,sold:186,badge:'New',image:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&q=85',description:'Supercharged by the Apple M3 chip. Thin, light and ready for work anywhere.'},
 {id:3,name:'Sony WH-1000XM5',category:'Accessories',price:9490000,sale:7490000,stock:24,rating:4.7,sold:241,badge:'Sale',image:'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&q=85',description:'Industry-leading noise cancellation and all-day comfort for focused listening.'},
 {id:4,name:'Classic Linen Shirt',category:'Fashion',price:1590000,sale:1190000,stock:36,rating:4.6,sold:154,image:'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&q=85',description:'Breathable premium linen with a relaxed silhouette for warm days.'},
 {id:5,name:'Nike Air Max 270',category:'Shoes',price:3890000,sale:3190000,stock:20,rating:4.8,sold:203,badge:'Hot',image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=85',description:'Comfortable cushioning and a bold silhouette made for everyday movement.'},
 {id:6,name:'Minimal Ceramic Set',category:'Home & Living',price:890000,sale:690000,stock:32,rating:4.5,sold:98,image:'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=700&q=85',description:'Hand-finished ceramic tableware to bring calm to your daily rituals.'},
]
const money=(n:number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n)
const categories=['All','Electronics','Smartphones','Laptops','Fashion','Shoes','Accessories','Home & Living']

// ---- storage helpers -------------------------------------------------------
// Cart/wishlist are personal => scoped per account email (guests get their own scope).
// Orders are store-wide (admin sees all) but each order carries the buyer's email,
// and each user only ever sees their own orders.
const personalKey=(base:string,acc:Account|null)=>`${base}:${acc?acc.email:'guest'}`
const readJSON=<T,>(key:string,fallback:T):T=>{
 try{const raw=localStorage.getItem(key);return raw?(JSON.parse(raw) as T):fallback}catch{return fallback}
}
const writeJSON=(key:string,value:unknown)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}}

export default function DashboardApp(){
 const [user,setUser]=useState<Account|null>(null)
 const [login,setLogin]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('')
 const [products,setProducts]=useState<Product[]>(productSeed)
 const [cart,setCart]=useState<CartItem[]>([]),[wishlist,setWishlist]=useState<number[]>([]),[orders,setOrders]=useState<Order[]>([])
 const [page,setPage]=useState('home'),[selected,setSelected]=useState<Product|null>(null),[lastOrder,setLastOrder]=useState<Order|null>(null)
 const [query,setQuery]=useState(''),[category,setCategory]=useState('All'),[toast,setToast]=useState(''),[mobile,setMobile]=useState(false),[ready,setReady]=useState(false)

 // Load session first, then load data that belongs to that session
 useEffect(()=>{
  const acc:Account|null=readJSON('mc-user',null)
  setUser(acc)
  setCart(readJSON(personalKey('mc-cart',acc),[]))
  setWishlist(readJSON(personalKey('mc-wishlist',acc),[]))
  setOrders(readJSON('mc-orders',[]))
  setProducts(readJSON('mc-products',productSeed))
  setReady(true)
 },[])
 // Persist on change (only after initial load so we never wipe saved data with empty arrays)
 useEffect(()=>{if(ready)writeJSON(personalKey('mc-cart',user),cart)},[cart,ready,user])
 useEffect(()=>{if(ready)writeJSON(personalKey('mc-wishlist',user),wishlist)},[wishlist,ready,user])

 const flash=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),2500)}
 const saveCart=(next:CartItem[])=>setCart(next)
 const saveProducts=(next:Product[])=>{setProducts(next);writeJSON('mc-products',next)}
 const saveOrders=(next:Order[])=>{setOrders(next);writeJSON('mc-orders',next)}

 const add=(p:Product,qty:number=1)=>{
  const inCart=cart.find(x=>x.id===p.id)?.quantity||0
  const room=p.stock-inCart
  if(room<=0){flash('Not enough stock in cart');return}
  const take=Math.min(qty,room)
  const next=cart.some(x=>x.id===p.id)
   ?cart.map(x=>x.id===p.id?{...x,quantity:x.quantity+take}:x)
   :[...cart,{...p,quantity:take}]
  saveCart(next);flash('Added to cart')
 }
 const toggleWish=(id:number)=>{
  const next=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id]
  setWishlist(next)
  flash(wishlist.includes(id)?'Removed from wishlist':'Added to wishlist')
 }
 // `detail` keeps the selected product; every other page clears it
 const navigate=(p:string)=>{if(p!=='detail')setSelected(null);setPage(p);setMobile(false);window.scrollTo(0,0)}
 const openProduct=(p:Product)=>{setSelected(p);navigate('detail')}

 const loadFor=(acc:Account|null)=>{
  setCart(readJSON(personalKey('mc-cart',acc),[]))
  setWishlist(readJSON(personalKey('mc-wishlist',acc),[]))
 }
 const doLogin=(e:any)=>{
  e.preventDefault()
  const accounts:Record<string,Account>={
   'admin@gmail.com':{email:'admin@gmail.com',role:'admin',name:'Admin User'},
   'user@gmail.com':{email:'user@gmail.com',role:'user',name:'Alex Nguyen'},
  }
  const acc=accounts[email.trim().toLowerCase()]
  if(!acc||password!=='123456'){setError('Email hoặc mật khẩu không chính xác.');return}
  localStorage.setItem('mc-user',JSON.stringify(acc))
  setUser(acc);loadFor(acc);setLogin(false);setError('')
  flash(acc.role==='admin'?'Đã đăng nhập quản trị':'Đã đăng nhập')
 }
 const logout=()=>{
  localStorage.removeItem('mc-user')
  setUser(null);loadFor(null);setLastOrder(null)
  navigate('home');flash('Đã đăng xuất')
 }

 const myOrders=useMemo(()=>orders.filter(o=>o.customerEmail===(user?.email??'__none__')),[orders,user])

 if(login)return <Login email={email} password={password} setEmail={setEmail} setPassword={setPassword} error={error} onSubmit={doLogin} close={()=>setLogin(false)}/>
 if(user?.role==='admin')return <Admin products={products} setProducts={setProducts} orders={orders} setOrders={saveOrders} logout={logout} toast={toast}/>
 return <div className="storefront">
  {toast&&<div className="store-toast"><Check size={16}/>{toast}</div>}
  <Header cart={cart} query={query} setQuery={setQuery} onSearch={()=>navigate('products')} login={()=>setLogin(true)} logout={logout} user={user} navigate={navigate} mobile={()=>setMobile(true)}/>
  {mobile&&<MobileNav close={()=>setMobile(false)} navigate={navigate} user={user} login={()=>setLogin(true)} logout={logout}/>}
  <div className="category-bar">{categories.map(c=><button key={c} onClick={()=>{setCategory(c);navigate('products')}}>{c}</button>)}</div>
  {page==='home'&&<Home navigate={navigate} add={add} products={products} open={openProduct}/>}
  {page==='products'&&<Products products={products} query={query} category={category} setCategory={setCategory} add={add} wishlist={wishlist} toggleWish={toggleWish} open={openProduct}/>}
  {page==='detail'&&selected&&<Detail product={selected} add={add} wishlist={wishlist} toggleWish={toggleWish} navigate={navigate}/>}
  {page==='cart'&&<Cart cart={cart} saveCart={saveCart} navigate={navigate}/>}
  {page==='checkout'&&<Checkout cart={cart} saveCart={saveCart} orders={orders} saveOrders={saveOrders} products={products} saveProducts={saveProducts} user={user} navigate={navigate} onDone={(o:Order)=>{setLastOrder(o)}}/>}
  {page==='success'&&<Success navigate={navigate} order={lastOrder}/>}
  {page==='orders'&&<Orders orders={myOrders} navigate={navigate}/>}
  {page==='wishlist'&&<Wishlist products={products} wishlist={wishlist} toggleWish={toggleWish} add={add} open={openProduct}/>}
  {page==='profile'&&<Profile user={user} setUser={setUser} logout={logout}/>}
  <Footer/>
 </div>
}

function Header({cart,query,setQuery,onSearch,login,logout,user,navigate,mobile}:any){
 return <header className="shop-header">
  <button className="mobile-trigger" onClick={mobile}><Menu/></button>
  <button className="shop-logo" onClick={()=>navigate('home')}><span><ShoppingBag size={20}/></span>minimart</button>
  <div className="shop-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onSearch()} placeholder="Search products, brands and more..."/><button onClick={onSearch}>Search</button></div>
  <nav className="shop-actions">
   <button onClick={()=>navigate('wishlist')} aria-label="Wishlist"><Heart size={20}/></button>
   <button onClick={()=>navigate('cart')} className="cart-btn" aria-label="Cart"><ShoppingBag size={20}/>{cart.length>0&&<i>{cart.length}</i>}</button>
   {user
    ?<><button className="account-btn" onClick={()=>navigate('profile')}><User size={18}/><span>{user.name.split(' ')[0]}</span></button><button className="account-btn" onClick={logout} title="Đăng xuất" aria-label="Đăng xuất"><LogOut size={18}/></button></>
    :<button className="account-btn" onClick={login}><User size={18}/><span>Sign in</span></button>}
  </nav>
 </header>
}
function MobileNav({close,navigate,user,login,logout}:any){
 return <div className="mobile-nav">
  <button onClick={close}><X/></button>
  {['home','products','orders','wishlist','profile'].map(x=><button key={x} onClick={()=>navigate(x)}>{x}</button>)}
  {user
   ?<button onClick={logout}><LogOut size={16}/> Log out ({user.name})</button>
   :<button onClick={login}><User size={16}/> Sign in</button>}
 </div>
}
function Home({navigate,add,products,open}:any){
 return <main>
  <section className="hero">
   <div>
    <p className="eyebrow">SUMMER COLLECTION 2024</p>
    <h1>Find your next<br/><em>everyday favorite.</em></h1>
    <p>Thoughtful products for work, home and everywhere in between. Curated with care, delivered to your door.</p>
    <button className="hero-btn" onClick={()=>navigate('products')}>Shop collection <ArrowRight size={17}/></button>
   </div>
   <div className="hero-card"><img src={products[1].image} alt="MacBook Air"/><div><strong>New arrivals</strong><span>Up to 20% off</span></div></div>
  </section>
  <section className="section category-cards">
   <div className="section-heading">
    <div><p className="eyebrow">SHOP BY CATEGORY</p><h2>Something for everyone</h2></div>
    <button className="link-btn" onClick={()=>navigate('products')}>View all <ArrowRight size={15}/></button>
   </div>
   <div className="category-grid">{['Electronics','Fashion','Shoes','Home & Living'].map((c,i)=><button key={c} onClick={()=>navigate('products')} className={`cat-card cat-${i}`}><span>{c}</span><small>Explore collection <ArrowRight size={13}/></small></button>)}</div>
  </section>
  <ProductSection title="Featured products" products={products.slice(0,4)} add={add} navigate={navigate} open={open}/>
  <ProductSection title="New arrivals" products={products.slice(2,6)} add={add} navigate={navigate} open={open}/>
 </main>
}
function ProductSection({title,products,add,navigate,open}:any){
 return <section className="section">
  <div className="section-heading">
   <div><p className="eyebrow">CURATED FOR YOU</p><h2>{title}</h2></div>
   <button className="link-btn" onClick={()=>navigate('products')}>View all <ArrowRight size={15}/></button>
  </div>
  <div className="product-grid">{products.map((p:Product)=><ProductCard key={p.id} product={p} add={add} open={()=>open(p)}/>)}</div>
 </section>
}
function ProductCard({product,add,open,wishlist,toggleWish}:any){
 return <article className="product-card">
  <button className="product-image" onClick={open}><img src={product.image} alt={product.name}/>{product.badge&&<span className="badge">{product.badge}</span>}</button>
  {toggleWish&&<button className="wish-btn" onClick={()=>toggleWish(product.id)}><Heart size={17} fill={wishlist?.includes(product.id)?'currentColor':'none'}/></button>}
  <div className="product-info">
   <p>{product.category}</p><h3>{product.name}</h3>
   <div className="rating"><Star size={14} fill="currentColor"/> {product.rating} <span>({product.sold})</span></div>
   <div className="price-row"><strong>{money(product.sale)}</strong><del>{money(product.price)}</del></div>
   <button className="add-btn" onClick={()=>add(product)}>Add to cart <Plus size={15}/></button>
  </div>
 </article>
}
function Products({products,query,category,setCategory,add,wishlist,toggleWish,open}:any){
 const [sort,setSort]=useState('popular')
 const filtered=useMemo(()=>{
  let arr=products.filter((p:Product)=>(p.name+p.category).toLowerCase().includes(query.toLowerCase())&&(category==='All'||category===p.category||category==='Electronics'&&['Smartphones','Laptops'].includes(p.category)))
  if(sort==='low')arr=[...arr].sort((a:Product,b:Product)=>a.sale-b.sale)
  if(sort==='high')arr=[...arr].sort((a:Product,b:Product)=>b.sale-a.sale)
  return arr
 },[products,query,category,sort])
 return <main className="listing section">
  <div className="crumb">Home <ChevronRight size={14}/> Products</div>
  <div className="listing-head">
   <div><p className="eyebrow">OUR CATALOG</p><h1>All products</h1><p>Showing {filtered.length} products</p></div>
   <select value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">Sort: Popular</option><option value="low">Price: Low to high</option><option value="high">Price: High to low</option></select>
  </div>
  <div className="filter-pills">{categories.map(c=><button className={category===c?'selected':''} key={c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
  <div className="product-grid wide">{filtered.map((p:Product)=><ProductCard key={p.id} product={p} add={add} wishlist={wishlist} toggleWish={toggleWish} open={()=>open(p)}/>)}</div>
 </main>
}
function Detail({product,add,wishlist,toggleWish,navigate}:any){
 const [qty,setQty]=useState(1)
 return <main className="detail section">
  <div className="crumb"><button onClick={()=>navigate('home')}>Home</button> <ChevronRight size={14}/> <button onClick={()=>navigate('products')}>{product.category}</button> <ChevronRight size={14}/> {product.name}</div>
  <div className="detail-grid">
   <div className="detail-image"><img src={product.image} alt={product.name}/></div>
   <div className="detail-copy">
    <p className="eyebrow">{product.category}</p>
    <h1>{product.name}</h1>
    <div className="detail-rating"><Star size={16} fill="currentColor"/> {product.rating} <span>· {product.sold} sold</span></div>
    <div className="detail-price"><strong>{money(product.sale)}</strong><del>{money(product.price)}</del><b>{Math.round((1-product.sale/product.price)*100)}% OFF</b></div>
    <p className="description">{product.description}</p>
    <p className="stock"><Check size={16}/> {product.stock>0?`In stock · ${product.stock} available · Ready to ship`:'Out of stock'}</p>
    <div className="quantity"><button onClick={()=>setQty(Math.max(1,qty-1))}>−</button><b>{qty}</b><button onClick={()=>setQty(Math.min(product.stock,qty+1))}>+</button></div>
    <div className="detail-actions">
     <button className="hero-btn" disabled={product.stock<=0} onClick={()=>add(product,qty)}>Add to cart <ShoppingBag size={17}/></button>
     <button className="outline-btn" onClick={()=>toggleWish(product.id)}><Heart size={18} fill={wishlist.includes(product.id)?'currentColor':'none'}/></button>
    </div>
   </div>
  </div>
  <div className="info-tabs">
   <h2>Product details</h2>
   <p>{product.description} Designed for people who value quality, function and a little bit of beauty in everyday objects.</p>
   <div className="spec-grid"><span>Material <b>Premium quality</b></span><span>Warranty <b>12 months</b></span><span>Delivery <b>2–4 business days</b></span></div>
  </div>
 </main>
}
function Cart({cart,saveCart,navigate}:any){
 const subtotal=cart.reduce((a:number,x:CartItem)=>a+x.sale*x.quantity,0)
 return <main className="section cart-page">
  <p className="eyebrow">YOUR BAG</p><h1>Shopping cart</h1>
  {!cart.length
   ?<Empty text="Your cart is waiting for something lovely." action="Start shopping" onClick={()=>navigate('products')}/>
   :<div className="cart-grid">
    <div className="cart-list">{cart.map((x:CartItem)=>
     <div className="cart-item" key={x.id}>
      <img src={x.image} alt={x.name}/>
      <div><p>{x.category}</p><h3>{x.name}</h3><strong>{money(x.sale)}</strong></div>
      <div className="quantity">
       <button onClick={()=>saveCart(cart.map((c:CartItem)=>c.id===x.id?{...c,quantity:Math.max(1,c.quantity-1)}:c))}>−</button>
       <b>{x.quantity}</b>
       <button onClick={()=>saveCart(cart.map((c:CartItem)=>c.id===x.id?{...c,quantity:Math.min(x.stock,c.quantity+1)}:c))}>+</button>
      </div>
      <button className="remove" onClick={()=>saveCart(cart.filter((c:CartItem)=>c.id!==x.id))}><Trash2 size={17}/></button>
     </div>)}
    </div>
    <Summary subtotal={subtotal} navigate={navigate}/>
   </div>}
 </main>
}
function Summary({subtotal,navigate}:any){
 return <aside className="summary">
  <h3>Order summary</h3>
  <p><span>Subtotal</span><b>{money(subtotal)}</b></p>
  <p><span>Shipping</span><b>{subtotal?money(30000):money(0)}</b></p>
  <hr/>
  <p className="total"><span>Total</span><b>{money(subtotal+(subtotal?30000:0))}</b></p>
  <button className="hero-btn full" onClick={()=>navigate('checkout')}>Proceed to checkout <ArrowRight size={16}/></button>
 </aside>
}
function Checkout({cart,saveCart,orders,saveOrders,products,saveProducts,user,navigate,onDone}:any){
 const [form,setForm]=useState({name:user?.name||'',phone:'',email:user?.email||'',address:'',city:'Ho Chi Minh City',note:'',payment:'Cash on Delivery'})
 const subtotal=cart.reduce((a:number,x:CartItem)=>a+x.sale*x.quantity,0)
 // Checkout requires an account so each order belongs to exactly one user
 if(!user)return <main className="section checkout"><p className="eyebrow">CHECKOUT</p><h1>Sign in required</h1><p style={{color:'#737b86'}}>Bạn cần đăng nhập để đặt hàng, để đơn hàng được gắn với đúng tài khoản của bạn.</p><div><button className="hero-btn" onClick={()=>navigate('home')}>Về trang chủ để đăng nhập</button></div></main>
 if(!cart.length)return <main className="section checkout"><p className="eyebrow">CHECKOUT</p><h1>Your cart is empty</h1><div><button className="hero-btn" onClick={()=>navigate('products')}>Start shopping</button></div></main>
 const submit=(e:any)=>{
  e.preventDefault()
  const order:Order={id:'#MC-'+(1049+orders.length),date:new Date().toLocaleDateString('en-GB'),items:cart,total:subtotal+30000,payment:form.payment,status:'Pending',customer:form.name,customerEmail:user.email,address:form.address}
  // Deduct stock from the shared catalog
  saveProducts(products.map((p:Product)=>{const bought=cart.filter((x:CartItem)=>x.id===p.id).reduce((a:number,x:CartItem)=>a+x.quantity,0);return bought?{...p,stock:Math.max(0,p.stock-bought)}:p}))
  saveOrders([order,...orders])
  saveCart([])
  onDone(order)
  navigate('success')
 }
 return <main className="section checkout">
  <div>
   <p className="eyebrow">CHECKOUT</p><h1>Complete your order</h1>
   <form className="checkout-form" onSubmit={submit}>
    <h3>Contact information</h3>
    <div className="form-two">
     <label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
     <label>Phone number<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
    </div>
    <label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    <label>Delivery address<input required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
    <label>Note<textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Anything we should know?"/></label>
    <h3>Payment method</h3>
    {['Cash on Delivery','Bank Transfer','Credit Card'].map(p=><label className="radio" key={p}><input type="radio" name="payment" checked={form.payment===p} onChange={()=>setForm({...form,payment:p})}/>{p}</label>)}
    <button className="hero-btn full">Place order <ArrowRight size={16}/></button>
   </form>
  </div>
  <Summary subtotal={subtotal} navigate={navigate}/>
 </main>
}
function Success({navigate,order}:any){
 return <main className="success-page section">
  <div className="success-icon"><Check size={35}/></div>
  <p className="eyebrow">ORDER CONFIRMED</p>
  <h1>Thank you for your order.</h1>
  <p>We’ll send updates as your order makes its way to you.</p>
  <div className="success-card">
   <span>Order ID <b>{order?.id||'—'}</b></span>
   <span>Total <b>{money(order?.total||0)}</b></span>
   <span>Payment <b>{order?.payment||'—'}</b></span>
  </div>
  <div>
   <button className="hero-btn" onClick={()=>navigate('orders')}>View order</button>
   <button className="outline-btn" onClick={()=>navigate('products')}>Continue shopping</button>
  </div>
 </main>
}
function Orders({orders,navigate}:any){
 return <main className="section">
  <p className="eyebrow">ACCOUNT</p><h1>My orders</h1>
  <div className="order-list">
   {orders.length
    ?orders.map((o:Order)=>
     <div className="order-card" key={o.id}>
      <div><strong>{o.id}</strong><span>{o.date} · {o.items.length} items</span></div>
      <b>{money(o.total)}</b>
      <span className={`order-status ${o.status.toLowerCase()}`}><Truck size={15}/>{o.status}</span>
     </div>)
    :<Empty text="You haven’t placed any orders yet." action="Explore products" onClick={()=>navigate('products')}/>}
  </div>
 </main>
}
function Wishlist({products,wishlist,toggleWish,add,open,navigate}:any){
 const items=products.filter((p:Product)=>wishlist.includes(p.id))
 return <main className="section">
  <p className="eyebrow">SAVED FOR LATER</p><h1>Wishlist</h1>
  {items.length
   ?<div className="product-grid">{items.map((p:Product)=><ProductCard key={p.id} product={p} add={add} wishlist={wishlist} toggleWish={toggleWish} open={()=>open(p)}/>)}</div>
   :<Empty text="Save pieces you love to find them here." action="Browse products" onClick={()=>navigate('products')}/>}
 </main>
}

function Profile({user,setUser,logout}:any){
 const [saved,setSaved]=useState(false)
 const [form,setForm]=useState({name:user?.name||'',email:user?.email||'',phone:'',address:''})
 const save=(e:any)=>{
  e.preventDefault()
  const next={...user,name:form.name}
  setUser(next);localStorage.setItem('mc-user',JSON.stringify(next));setSaved(true)
 }
 return <main className="section profile-page">
  <p className="eyebrow">ACCOUNT SETTINGS</p><h1>My profile</h1>
  <div className="profile-card">
   <div className="profile-avatar">{form.name.split(' ').map((x:string)=>x[0]).join('')}</div>
   <h2>{form.name}</h2><p>{form.email}</p>
  </div>
  <form className="profile-form" onSubmit={save}>
   <label>Full name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label>Email<input value={form.email} disabled/></label>
   <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
   <label>Address<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
   <button className="hero-btn">{saved?'Saved':'Save changes'}</button>
  </form>
  <button className="outline-btn" style={{marginTop:16}} onClick={logout}><LogOut size={17}/> Log out</button>
 </main>
}
function Empty({text,action,onClick}:any){
 return <div className="empty"><ShoppingBag size={32}/><p>{text}</p><button className="hero-btn" onClick={onClick}>{action}</button></div>
}
function Footer(){
 return <footer>
  <div><button className="shop-logo"><span><ShoppingBag size={18}/></span>minimart</button><p>Thoughtful products for everyday living.</p></div>
  <div><b>Shop</b><span>New arrivals</span><span>Best sellers</span></div>
  <div><b>Help</b><span>Shipping & returns</span><span>Contact us</span></div>
  <div><b>Follow along</b><span>Instagram · Facebook</span></div>
 </footer>
}
function Login({email,password,setEmail,setPassword,error,onSubmit,close}:any){
 return <main className="auth-page">
  <button className="auth-close" onClick={close}><X/></button>
  <div className="auth-art">
   <span className="shop-logo"><span><ShoppingBag size={20}/></span>minimart</span>
   <div>
    <p className="eyebrow">WELCOME TO MINIMART</p>
    <h1>Good things,<br/><em>beautifully chosen.</em></h1>
    <p>A thoughtful marketplace for the things that make everyday life better.</p>
   </div>
  </div>
  <form className="auth-form" onSubmit={onSubmit}>
   <p className="eyebrow">YOUR ACCOUNT</p>
   <h2>Welcome back</h2>
   <p>Sign in to continue shopping.</p>
   <label>Email address<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
   <label>Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
   {error&&<small className="error">{error}</small>}
   <button className="hero-btn full">Sign in <ArrowRight size={16}/></button>
   <small className="demo">Demo: user@gmail.com (khách hàng) hoặc admin@gmail.com (quản trị) · mật khẩu 123456</small>
  </form>
 </main>
}

function Admin({products,setProducts,orders,setOrders,logout,toast}:any){
 const [tab,setTab]=useState('Dashboard')
 const [modal,setModal]=useState(false)
 const [edit,setEdit]=useState<Product|null>(null)
 const save=(p:Product)=>{
  const next=edit?products.map((x:Product)=>x.id===p.id?p:x):[p,...products]
  setProducts(next);localStorage.setItem('mc-products',JSON.stringify(next));setModal(false)
 }
 return <div className="admin-app">
  {toast&&<div className="store-toast"><Check size={16}/>{toast}</div>}
  <aside className="admin-side">
   <button className="shop-logo"><span><ShoppingBag size={18}/></span>minimart</button>
   <p className="admin-label">ADMIN CONSOLE</p>
   {['Dashboard','Products','Orders','Customers'].map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)} key={x}><LayoutDashboard size={17}/>{x}</button>)}
   <button className="admin-logout" onClick={logout}><LogOut size={17}/>Log out</button>
  </aside>
  <main className="admin-main">
   <header><div><p className="eyebrow">MINIMART ADMIN</p><h1>{tab}</h1></div><span className="admin-avatar">AD</span></header>
   {tab==='Dashboard'&&<AdminDashboard products={products} orders={orders}/>}
   {tab==='Products'&&<AdminProducts products={products} setEdit={setEdit} setModal={setModal} deleteProduct={(id:number)=>{setProducts(products.filter((p:Product)=>p.id!==id));localStorage.setItem('mc-products',JSON.stringify(products.filter((p:Product)=>p.id!==id)))}}/>}
   {tab==='Orders'&&<AdminOrders orders={orders} setOrders={setOrders}/>}
   {tab==='Customers'&&<AdminCustomers orders={orders}/>}
  </main>
  {modal&&<AdminForm product={edit} close={()=>setModal(false)} save={save}/>}
 </div>
}
function AdminDashboard({products,orders}:any){
 const revenue=orders.filter((o:Order)=>o.status!=='Cancelled').reduce((a:number,o:Order)=>a+o.total,0)
 return <div className="admin-content">
  <div className="admin-stats">
   <div><span>Revenue</span><strong>{money(revenue)}</strong><small>from real orders</small></div>
   <div><span>Orders</span><strong>{orders.length}</strong><small>all customers</small></div>
   <div><span>Products</span><strong>{products.length}</strong><small>in catalog</small></div>
   <div><span>Customers</span><strong>{new Set(orders.map((o:Order)=>o.customerEmail)).size}</strong><small>with orders</small></div>
  </div>
  <div className="admin-grid">
   <section className="admin-panel"><h3>Revenue overview</h3><div className="fake-chart"><i/><i/><i/><i/><i/><i/><i/></div></section>
   <section className="admin-panel"><h3>Recent orders</h3>
    {orders.slice(0,4).map((o:Order)=><div className="admin-order" key={o.id}><span>{o.customer} · {o.customerEmail}</span><b>{money(o.total)}</b><small>{o.status}</small></div>)}
    {!orders.length&&<p style={{color:'#999'}}>Chưa có đơn hàng nào.</p>}
   </section>
  </div>
 </div>
}
function AdminProducts({products,setEdit,setModal,deleteProduct}:any){
 return <div className="admin-content">
  <div className="admin-toolbar"><p>Manage your product catalog and inventory.</p><button className="hero-btn" onClick={()=>{setEdit(null);setModal(true)}}><Plus size={16}/> Add product</button></div>
  <div className="admin-table"><table>
   <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th/></tr></thead>
   <tbody>{products.map((p:Product)=>
    <tr key={p.id}>
     <td><img src={p.image} alt=""/><b>{p.name}</b></td>
     <td>{p.category}</td>
     <td>{money(p.sale)}</td>
     <td>{p.stock}</td>
     <td><span className="table-status">{p.stock>0?'Active':'Out of stock'}</span></td>
     <td><button onClick={()=>{setEdit(p);setModal(true)}}><Pencil size={15}/></button><button onClick={()=>deleteProduct(p.id)}><Trash2 size={15}/></button></td>
    </tr>)}
   </tbody>
  </table></div>
 </div>
}
function AdminOrders({orders,setOrders}:any){
 return <div className="admin-content">
  <p>Track and manage every order from your store.</p>
  <div className="admin-table"><table>
   <thead><tr><th>ORDER ID</th><th>CUSTOMER</th><th>TOTAL</th><th>PAYMENT</th><th>STATUS</th></tr></thead>
   <tbody>{orders.map((o:Order)=>
    <tr key={o.id}>
     <td><b>{o.id}</b></td>
     <td>{o.customer}<small>{o.customerEmail}</small></td>
     <td>{money(o.total)}</td>
     <td>{o.payment}</td>
     <td><select value={o.status} onChange={e=>setOrders(orders.map((x:Order)=>x.id===o.id?{...x,status:e.target.value}:x))}><option>Pending</option><option>Processing</option><option>Shipping</option><option>Completed</option><option>Cancelled</option></select></td>
    </tr>)}
   </tbody>
  </table></div>
 </div>
}
function AdminCustomers({orders}:any){
 const byEmail=new Map<string,{name:string;count:number;spent:number}>()
 orders.forEach((o:Order)=>{
  const cur=byEmail.get(o.customerEmail)||{name:o.customer,count:0,spent:0}
  byEmail.set(o.customerEmail,{name:o.customer,count:cur.count+1,spent:cur.spent+(o.status!=='Cancelled'?o.total:0)})
 })
 const rows=[...byEmail.entries()]
 return <div className="admin-content">
  <p>Customer accounts and lifetime value (from real orders).</p>
  <div className="admin-table"><table>
   <thead><tr><th>CUSTOMER</th><th>ORDERS</th><th>TOTAL SPENT</th><th>STATUS</th></tr></thead>
   <tbody>
    {rows.length?rows.map(([email,c])=>
     <tr key={email}>
      <td><b>{c.name}</b><small>{email}</small></td>
      <td>{c.count}</td>
      <td>{money(c.spent)}</td>
      <td><span className="table-status">Active</span></td>
     </tr>)
    :<tr><td colSpan={4} style={{color:'#999'}}>Chưa có khách hàng nào đặt hàng.</td></tr>}
   </tbody>
  </table></div>
 </div>
}
function AdminForm({product,close,save}:any){
 const [f,setF]=useState<Product>(product||{id:Date.now(),name:'',category:'Accessories',price:0,sale:0,stock:0,rating:4.5,sold:0,image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=85',description:''})
 return <div className="modal-wrap">
  <form className="admin-modal" onSubmit={e=>{e.preventDefault();save(f)}}>
   <button type="button" className="modal-x" onClick={close}><X/></button>
   <h2>{product?'Edit product':'Add product'}</h2>
   {(['name','category','price','sale','stock'] as const).map(k=>
    <label key={k}>{k==='name'?'Product name':k==='category'?'Category':k==='price'?'Price':k==='sale'?'Sale price':'Stock'}
     <input required value={String(f[k])} onChange={e=>setF({...f,[k]:k==='price'||k==='sale'||k==='stock'?Number(e.target.value):e.target.value})}/>
    </label>)}
   <button className="hero-btn full">Save product</button>
  </form>
 </div>
}
