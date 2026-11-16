import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Minus, Plus, ShoppingBag, Trash2, Volume2, VolumeX, X, MapPin, Clock, Sparkles, Play } from 'lucide-react';
import heroUrl from 'container:///mnt/data/src/assets/0fe834d13961ec13-image_20261116_140613.webp';
import spaceUrl from 'container:///mnt/data/src/assets/ef9f6a6e330f93b9-image_20261116_140614.webp';
import pourUrl from 'container:///mnt/data/src/assets/19de6adea9630da2-image_20261116_140615.webp';
import bakeryUrl from 'container:///mnt/data/src/assets/e4b22213fa979a58-image_20261116_140614_1.webp';

type CartItem = { key:string; name:string; unit:number; qty:number; detail:string; recordId?:string };
type MenuItem = { id:string; name:string; price:number; cat:string; origin:string; notes:string; acidity:number; body:number; sweet:number; tag?:string };

const MENU: MenuItem[] = [
  { id:'apothecary', name:'No. 01 — The Apothecary', price:95, cat:'Espresso', origin:'Ethiopia · 2100m · Washed', notes:'bergamot / black tea / honey', acidity:82, body:58, sweet:78, tag:'HOUSE SIGNATURE' },
  { id:'cortado', name:'Cortado Noir', price:110, cat:'Espresso', origin:'Colombia · 1750m · Honey', notes:'panela / cacao nib', acidity:52, body:84, sweet:68 },
  { id:'yirgacheffe', name:'Yirgacheffe — Jasmine Lot', price:145, cat:'Pour-Over', origin:'Ethiopia · 2300m · Natural', notes:'jasmine / peach / Earl Grey', acidity:92, body:42, sweet:86, tag:'LIMITED LOT' },
  { id:'yemen', name:'Yemen — Ancient Terraces', price:165, cat:'Pour-Over', origin:'Yemen · 2400m · Dried', notes:'dried fig / spice / date', acidity:58, body:78, sweet:74 },
  { id:'tonic', name:'Sage & Smoked Orange Espresso Tonic', price:135, cat:'Signature Botanicals', origin:'House botanical · Smoked orange', notes:'sage / smoked orange / tonic', acidity:76, body:48, sweet:62, tag:'BOTANICAL' },
  { id:'rose', name:'Cardamom Rose Latte', price:125, cat:'Signature Botanicals', origin:'House botanical · Oat', notes:'cardamom / rose / oat', acidity:38, body:68, sweet:88 },
  { id:'bun', name:'Cardamom Bun', price:85, cat:'Bakery', origin:'Baked 06:40 · Laminated', notes:'cardamom sugar / orange zest', acidity:18, body:72, sweet:82 },
  { id:'cheesecake', name:'Burnt Basque Cheesecake', price:120, cat:'Bakery', origin:'Baked daily · Burnt top', notes:'caramelised / vanilla / salt', acidity:28, body:88, sweet:80 },
  { id:'croissant', name:'36h Croissant', price:75, cat:'Bakery', origin:'36-hour dough · French butter', notes:'butter / honey / flake salt', acidity:12, body:64, sweet:58 },
];

const BEANS = [
  { id:'jasmine', name:'No. 01 JASMINE', origin:'Ethiopia Yirgacheffe', price:420, notes:'Jasmine · Peach · Earl Grey', roast:'ROAST #214 — 12.11.2026' },
  { id:'terra', name:'No. 02 TERRA', origin:'Colombia Huila', price:390, notes:'Panela · Red apple · Cacao', roast:'ROAST #213 — 11.11.2026' },
  { id:'smoke', name:'No. 03 SMOKE', origin:'Yemen + Sumatra Blend', price:450, notes:'Date · Smoke · Dried fig', roast:'ROAST #212 — 10.11.2026' },
];

async function api(action:string, args:any){
  const res = await fetch("actions", { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({action, args}) });
  const json = await res.json().catch(()=>({}));
  if(!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data;
}

function Bars({label, value}:{label:string; value:number}){
  return <div><div className="flex justify-between font-mono2 text-[10px] tracking-[0.14em] text-[#E8DDD0]/80"><span>{label}</span><span>{value}</span></div><div className="mt-1 h-[5px] bg-white/15 rounded-full overflow-hidden"><div className="h-full bg-[#C75B2A] rounded-full transition-all" style={{width:`${value}%`}} /></div></div>;
}
function SectionTag({children, dark=false}:{children:React.ReactNode; dark?:boolean}){
  return <div className={`font-mono2 text-[11px] tracking-[0.22em] flex items-center gap-2 ${dark?'text-[#131210]':'text-[#E8DDD0]'}`}><span className="inline-block w-7 h-px bg-[#C75B2A]" />{children}</div>;
}

export default function App(){
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [sound, setSound] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [mood, setMood] = useState('');
  const [milk, setMilk] = useState('');
  const [adventure, setAdventure] = useState('');
  const [quizResult, setQuizResult] = useState<MenuItem|null>(null);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [newsState, setNewsState] = useState<'idle'|'busy'|'done'|'error'>('idle');
  const [newsMsg, setNewsMsg] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [grinds, setGrinds] = useState<Record<string,string>>({jasmine:'Whole Bean', terra:'Whole Bean', smoke:'Whole Bean'});
  const [freqs, setFreqs] = useState<Record<string,string>>({jasmine:'One-time', terra:'One-time', smoke:'One-time'});
  const [now, setNow] = useState(new Date());
  const [cursorLabel, setCursorLabel] = useState('');
  const [cursorPos, setCursorPos] = useState({x:-100,y:-100});
  const [cursorBig, setCursorBig] = useState(false);
  const audioRef = useRef<{ctx:AudioContext; source:AudioBufferSourceNode; gain:GainNode}|null>(null);
  const startCrackle = async () => {
    try{
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if(!Ctx){ setToast('Sound is not available in this preview.'); return; }
      if(audioRef.current){ try{ await audioRef.current.ctx.resume(); }catch{} return; }
      const ctx:AudioContext = new Ctx();
      const len = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0;i<len;i++){ data[i] = (Math.random()*2-1) * 0.18; if(Math.random()<0.0004) data[i] = (Math.random()*2-1)*0.9; }
      const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=3200; filter.Q.value=0.6;
      const gain = ctx.createGain(); gain.gain.value=0.025;
      source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      source.start();
      audioRef.current = {ctx, source, gain};
    }catch{ setToast('Sound is not available in this preview.'); }
  };
  const stopCrackle = async () => { const a=audioRef.current; if(!a) return; try{ a.source.stop(); }catch{} try{ await a.ctx.close(); }catch{} audioRef.current=null; };
  const toggleSound = async () => { const next=!sound; setSound(next); if(next){ await startCrackle(); setToast('Vinyl crackle on — room sound playing'); } else { await stopCrackle(); setToast('Room sound off'); } };
  useEffect(()=>()=>{ const a=audioRef.current; if(a){ try{a.source.stop();}catch{} try{a.ctx.close();}catch{} } },[]);

  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()), 30000); return ()=>clearInterval(t); },[]);
  useEffect(()=>{
    const start=Date.now();
    const iv=setInterval(()=>{ const s=Math.min(27, Math.floor((Date.now()-start)/66)); setTimer(s); if(s>=27) clearInterval(iv); },66);
    const out=setTimeout(()=>setLoading(false), 1850);
    return ()=>{clearInterval(iv); clearTimeout(out);};
  },[]);
  useEffect(()=>{
    const onMove=(e:MouseEvent)=>{ setCursorPos({x:e.clientX,y:e.clientY}); const el=(e.target as HTMLElement).closest('[data-cursor]'); setCursorLabel(el?.getAttribute('data-cursor')||''); setCursorBig(!!el); };
    window.addEventListener('mousemove', onMove); return ()=>window.removeEventListener('mousemove', onMove);
  },[]);
  useEffect(()=>{
    const obs=new IntersectionObserver((es)=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('is-visible'); }),{threshold:0.12});
    document.querySelectorAll('.reveal').forEach(el=>obs.observe(el)); return ()=>obs.disconnect();
  },[loading, filter]);
  useEffect(()=>{
    if(toast){ const t=setTimeout(()=>setToast(''), 3600); return ()=>clearTimeout(t); }
  },[toast]);

  // Load saved cart
  useEffect(()=>{
    (async()=>{
      try{
        const data:any = await api("records.list", {collection:"mara_cart"});
        const recs=data?.records||[];
        setCart(recs.map((r:any)=>({...r.value, recordId:r.id})));
      }catch{ /* preview: keep in-memory cart */ }
    })();
  },[]);

  const hour = now.getHours();
  const isOpen = hour>=7 && hour<18;
  const subtotal = cart.reduce((s,i)=>s+i.unit*i.qty,0);
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const progress = Math.min(100, Math.round(subtotal/800*100));
  const filtered = filter==='All'? MENU : MENU.filter(m=>m.cat===filter);

  async function syncCartItem(item:CartItem){
    try{
      if(item.recordId){ await api("records.replace", {collection:"mara_cart", id:item.recordId, value:{key:item.key,name:item.name,unit:item.unit,qty:item.qty,detail:item.detail}}); }
      else {
        const created:any = await api("records.create", {collection:"mara_cart", value:{key:item.key,name:item.name,unit:item.unit,qty:item.qty,detail:item.detail}, idempotency_key:`mara-cart-${item.key}-${Date.now()}`});
        if(created?.id) setCart(prev=>prev.map(p=>p.key===item.key?{...p, recordId:created.id}:p));
      }
    }catch{ /* keep local cart */ }
  }
  function addToCart(item:Omit<CartItem,'qty'>, qty=1){
    const existing = cart.find(c=>c.key===item.key);
    const next:CartItem = existing? {...existing, qty:existing.qty+qty} : {...item, qty};
    setCart(prev=> existing? prev.map(p=>p.key===item.key?next:p) : [...prev,next]);
    setToast(`${item.name} added to your tray`);
    syncCartItem(next);
  }
  async function changeQty(key:string, delta:number){
    const item = cart.find(c=>c.key===key); if(!item) return;
    const nextQty = item.qty+delta;
    if(nextQty<=0){ await removeItem(key); return; }
    const next={...item, qty:nextQty}; setCart(prev=>prev.map(p=>p.key===key?next:p)); syncCartItem(next);
  }
  async function removeItem(key:string){
    const item=cart.find(c=>c.key===key); setCart(prev=>prev.filter(p=>p.key!==key));
    if(item?.recordId){ try{ await api("records.delete", {collection:"mara_cart", id:item.recordId}); }catch{} }
  }
  async function checkout(){
    if(cart.length===0) return; setCheckoutBusy(true);
    try{
      await api("records.create", {collection:"mara_orders", value:{items:cart.map(c=>({name:c.name,qty:c.qty,unit:c.unit,detail:c.detail})), subtotal, placedAt:new Date().toISOString(), pickup:'14 Fouad St, Alexandria'}, idempotency_key:`mara-order-${Date.now()}`});
      for(const it of cart){ if(it.recordId){ try{ await api("records.delete", {collection:"mara_cart", id:it.recordId}); }catch{} } }
      setCart([]); setCartOpen(false); setToast('Order placed — See you at Fouad St');
    }catch(e){ setToast('Order saved to your tray. Please try checkout again.'); }
    setCheckoutBusy(false);
  }
  async function subscribe(e:React.FormEvent){
    e.preventDefault(); if(!email.includes('@')){ setNewsState('error'); setNewsMsg('Please enter a valid email.'); return; }
    setNewsState('busy'); setNewsMsg('');
    try{
      await api("records.create", {collection:"mara_newsletter", value:{email:email.trim().toLowerCase(), source:'THE MORNING POUR', subscribedAt:new Date().toISOString()}, idempotency_key:`mara-news-${email.trim().toLowerCase()}-${Date.now()}`});
      setNewsState('done'); setNewsMsg("You're in. First pour Friday 07:00.");
    }catch(err){ setNewsState('error'); setNewsMsg(err instanceof Error? err.message : 'Could not save your signup. Please try again.'); }
  }
  function runQuiz(){
    if(!mood||!milk||!adventure){ setToast('Choose a mood, milk and adventure first'); return; }
    let pick = MENU[0];
    if(mood==='Bright') pick = MENU.find(m=>m.id==='yirgacheffe')!;
    else if(mood==='Cozy') pick = MENU.find(m=>m.id==='rose')!;
    else if(mood==='Bold') pick = MENU.find(m=>m.id==='yemen')!;
    else pick = MENU.find(m=>m.id==='tonic')!;
    if(adventure==='Classic' && mood==='Strange') pick = MENU.find(m=>m.id==='apothecary')!;
    if(milk==='Dairy' && mood==='Cozy') pick = MENU.find(m=>m.id==='rose')!;
    setQuizResult(pick);
    document.getElementById('quiz-result')?.scrollIntoView({behavior:'smooth', block:'nearest'});
  }
  const why = useMemo(()=> mood==='Bright' ? 'Bright means high acidity and floral lift — this lot opens like jasmine tea, then peach.' : mood==='Cozy' ? 'Cozy means warmth, spice and soft milk. Rose and cardamom do the comforting, oat does the smoothing.' : mood==='Bold' ? 'Bold means depth, dried fruit and spice. This is the slow, terraced cup.' : 'Strange means botanical and unexpected. Sage, smoke and tonic — a cup that behaves like a perfume.',[mood]);

  const beanPrice = (b:typeof BEANS[0])=>{ const f=freqs[b.id]; return f==='One-time'? b.price : Math.round(b.price*0.9); };

  return (
    <div data-safe-area-inset-root className="grain min-h-screen bg-[#131210] text-[#F4EFE8]" style={{boxSizing:'border-box', paddingTop:'var(--safe-area-inset-top)'}}>
      {/* Custom cursor */}
      <div className="pointer-events-none fixed z-[120] hidden md:flex items-center justify-center rounded-full border border-[#C75B2A] bg-[#C75B2A]/10 backdrop-blur-sm transition-all duration-200" style={{left:cursorPos.x, top:cursorPos.y, width:cursorBig?88:14, height:cursorBig?88:14, transform:'translate(-50%,-50%)'}}>
        {cursorBig && <span className="font-mono2 text-[10px] tracking-[0.18em] text-[#F4EFE8]">{cursorLabel||'VIEW'}</span>}
      </div>

      {/* Preloader */}
      {loading && (
        <div className="fixed inset-0 z-[110] bg-[#131210] flex flex-col justify-between p-6 sm:p-10">
          <div className="flex justify-between font-mono2 text-[11px] tracking-[0.2em] text-[#E8DDD0]/70"><span>FOUAD ST — ALEXANDRIA</span><span>EST. 2019</span></div>
          <div className="text-center"><div className="font-display text-[clamp(72px,18vw,180px)] leading-[0.85] font-black tracking-tight">MĀRA<span className="text-[#C75B2A]">.</span></div><p className="font-mono2 text-xs tracking-[0.24em] mt-3 text-[#E8DDD0]/70">BOTANICAL ROASTERY & LISTENING BAR</p></div>
          <div><div className="flex justify-between font-mono2 text-xs"><span>ESPRESSO EXTRACTION</span><span className="text-[#C75B2A]">{String(timer).padStart(2,'0')}s / 27s</span></div><div className="h-[3px] bg-white/15 mt-3 overflow-hidden"><div className="h-full bg-[#C75B2A]" style={{width:`${timer/27*100}%`}} /></div></div>
        </div>
      )}

      {/* NAV */}
      <header data-safe-area-sticky-top className="sticky z-[80] px-3 sm:px-6" style={{top:'var(--safe-area-inset-top)'}}>
        <nav className="mx-auto mt-3 max-w-[1280px] flex items-center justify-between gap-3 rounded-full border border-white/20 bg-[#131210]/72 backdrop-blur-xl px-3 sm:px-5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <a href="#top" className="font-display text-[22px] font-black leading-none">MĀRA<span className="text-[#C75B2A]">®</span></a>
          <div className="hidden lg:flex items-center gap-6 font-mono2 text-[11px] tracking-[0.14em]">
            <a href="#manifesto" className="hover:text-[#C75B2A]">MANIFESTO</a><a href="#menu" className="hover:text-[#C75B2A]">MENU</a><a href="#roastery" className="hover:text-[#C75B2A]">ROASTERY</a><a href="#space" className="hover:text-[#C75B2A]">SPACE</a><a href="#visit" className="hover:text-[#C75B2A]">VISIT</a>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-full bg-[#1C2B23] border border-white/10 px-3 py-1.5 font-mono2 text-[10px] tracking-[0.08em]"><span className={`w-2 h-2 rounded-full ${isOpen?'bg-[#8A9A8B] pulse-dot':'bg-[#C75B2A]'}`} />{isOpen?'OPEN NOW • ETHIOPIA YIRGACHEFFE':'CLOSED • NEXT POUR 07:00'}</div>
            <button onClick={toggleSound} aria-label="Toggle sound" className="btn-press flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 font-mono2 text-[10px]">{sound?<Volume2 size={14}/>:<VolumeX size={14}/>} <span className="hidden sm:inline">{sound?'SOUND ON':'SOUND OFF'}</span></button>
            <button onClick={()=>setCartOpen(true)} data-cursor="TASTE" className="btn-press relative flex items-center gap-2 rounded-full bg-[#C75B2A] px-4 py-2 text-sm font-semibold"><ShoppingBag size={16}/> <span className="hidden sm:inline">Tray</span> <span className="min-w-[20px] h-5 px-1 grid place-items-center rounded-full bg-[#F4EFE8] text-[#131210] text-xs font-bold">{count}</span></button>
          </div>
        </nav>
      </header>

      <main id="top" className="overflow-x-clip">
        {/* HERO */}
        <section className="relative px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12 pb-0">
          <div className="mx-auto max-w-[1360px] grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-4 items-start">
            <div className="pt-2 lg:pt-10 relative">
              <p className="font-mono2 text-[10px] sm:text-[11px] tracking-[0.22em] text-[#E8DDD0]/80 leading-relaxed">BOTANICAL ROASTERY & LISTENING BAR — FOUAD ST, ALEXANDRIA • EST. 2019</p>
              <h1 className="font-display font-black leading-[0.86] tracking-[-0.03em] text-[clamp(56px,10.5vw,132px)] mt-5">Coffee,<br/><span className="italic font-light text-[#E8DDD0]">composed</span><br/>like perfume<span className="text-[#C75B2A]">.</span></h1>
              <p className="mt-6 max-w-[520px] text-[15px] sm:text-lg leading-relaxed text-[#E8DDD0]/85">Small lots, wild botanicals, and vinyl at 33rpm. We roast like apothecaries — measure everything, romanticize nothing.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#menu" data-cursor="TASTE" className="btn-press inline-flex items-center gap-2 rounded-full bg-[#C75B2A] px-6 py-3.5 font-semibold">Taste The Menu <ArrowRight size={17}/></a>
                <a href="#quiz" data-cursor="QUIZ" className="btn-press inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 font-semibold">Find Your Pour — Quiz</a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 font-mono2 text-[11px] tracking-[0.12em] text-[#E8DDD0]/70"><span>14 FARMS</span><span>100% TRACEABLE</span><span>33 RPM</span></div>
              <div className="hidden lg:block absolute -right-2 top-10 vertical-label font-mono2 text-[10px] text-[#E8DDD0]/50">SCROLL — POUR — LISTEN</div>
            </div>
            <div className="relative">
              <div className="arch overflow-hidden border border-white/15 aspect-[4/5] max-h-[640px] w-full"><img src={heroUrl} alt="Espresso cup with an orange slice at MĀRA" className="w-full h-full object-cover" /></div>
              <div className="floaty absolute -left-3 sm:-left-6 top-8 bg-[#F4EFE8] text-[#131210] rounded-full px-4 py-2 font-mono2 text-[10px] sm:text-[11px] font-bold shadow-xl">ROAST #214 — 12.11.2026</div>
              <div className="floaty absolute right-2 sm:-right-3 bottom-28 bg-[#1C2B23] border border-white/20 rounded-2xl px-4 py-3 font-mono2 text-[10px] leading-relaxed shadow-xl" style={{animationDelay:'0.8s'}}>TDS 1.42 • 94°C • 18.5g<br/><span className="text-[#8A9A8B]">MEASURE EVERYTHING</span></div>
              <div className="absolute left-3 sm:-left-4 -bottom-4 bg-[#C75B2A] rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl max-w-[310px]"><span className="w-9 h-9 rounded-full bg-black/25 grid place-items-center shrink-0"><Play size={16} className="ml-0.5"/></span><div className="font-mono2 text-[10px] leading-snug"><span className="text-white/70">NOW PLAYING</span><br/><b>Alice Coltrane — Journey in Satchidananda</b></div></div>
            </div>
          </div>
          <div className="mt-14 border-y border-white/15 py-3 overflow-hidden"><div className="marquee-track font-display text-[22px] sm:text-3xl italic"><span className="pr-8">ETHIOPIA • COLOMBIA • YEMEN • SUMATRA • BOTANICALS • VINYL •&nbsp;</span><span className="pr-8">ETHIOPIA • COLOMBIA • YEMEN • SUMATRA • BOTANICALS • VINYL •&nbsp;</span></div></div>
        </section>

        {/* MANIFESTO */}
        <section id="manifesto" className="bg-[#F4EFE8] text-[#131210] px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
          <div className="mx-auto max-w-[1360px] grid lg:grid-cols-[0.9fr_1.1fr] gap-10">
            <div className="lg:sticky lg:top-28 self-start reveal">
              <SectionTag dark>01 — THE PHILOSOPHY</SectionTag>
              <h2 className="font-display font-black leading-[0.92] text-[clamp(42px,6vw,76px)] mt-5">We don’t serve<br/>coffee. <span className="italic font-light text-[#C75B2A]">We prescribe it.</span></h2>
              <p className="mt-5 max-w-[440px] leading-relaxed text-[#131210]/75">Every cup starts as a formula — origin, water, rest, temperature — then ends as a feeling. That is the apothecary discipline.</p>
              <div className="mt-7 overflow-hidden rounded-[18px]"><img src={pourUrl} alt="Pour-over coffee flat lay with brewing tools" className="w-full h-[280px] sm:h-[340px] object-cover" /></div>
              <p className="font-mono2 text-[10px] tracking-[0.16em] mt-3 text-[#131210]/55">FIG. 02 — POUR-OVER, 94°C, 18.5G / 300ML</p>
            </div>
            <div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {n:'01', t:'Ethical Sourcing', d:'Direct trade, 2× farmgate price, and relationships with 14 farms we can name, visit, and defend.'},
                  {n:'02', t:'Water Chemistry', d:'Remineralized Alexandria water at 120ppm — Mg 22 / Ca 18 — because water is 98% of the cup.'},
                  {n:'03', t:'Roasting Craft', d:'Loring S15, a 27-second development, and a 9-day rest. No shortcuts. No stale heroics.'},
                ].map(x=><article key={x.n} className="reveal card-hover border border-[#131210]/15 bg-[#F2EDE6] rounded-[18px] p-5"><div className="font-display italic text-[#C75B2A] text-2xl">{x.n}</div><h3 className="font-display text-[22px] font-bold mt-3 leading-tight">{x.t}</h3><p className="text-sm leading-relaxed mt-2 text-[#131210]/70">{x.d}</p></article>)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#131210]/15 border border-[#131210]/15 rounded-[18px] overflow-hidden mt-5">
                {['14 — FARMS','9 — DAY REST','27s — DEVELOPMENT','100% — TRACEABLE'].map(s=>{const [a,b]=s.split(' — '); return <div key={s} className="bg-[#F4EFE8] p-4 sm:p-5"><div className="font-display text-2xl sm:text-3xl font-black">{a}</div><div className="font-mono2 text-[10px] tracking-[0.14em] mt-1 text-[#131210]/60">{b}</div></div>})}
              </div>
              <blockquote className="mt-8 border-l-[3px] border-[#C75B2A] pl-5 font-display italic text-[clamp(24px,3.4vw,38px)] leading-[1.15]">“A great cup should smell like a memory and taste like a decision.”<footer className="not-italic font-mono2 text-[11px] tracking-[0.18em] mt-3 text-[#131210]/60">— MĀRA, HOUSE RULE NO. 04</footer></blockquote>
            </div>
          </div>
        </section>

        {/* MENU */}
        <section id="menu" className="bg-[#1C2B23] px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
          <div className="mx-auto max-w-[1360px]">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 reveal"><div><SectionTag>02 — THE MENU</SectionTag><h2 className="font-display font-black text-[clamp(42px,6vw,76px)] leading-[0.92] mt-4">Taste by<br/><span className="italic font-light">intention.</span></h2></div><p className="max-w-[420px] text-[#E8DDD0]/75 leading-relaxed">Every drink lists its origin, elevation and process. No mystery, no marketing fog. Prices in EGP.</p></div>
            <div className="flex gap-2 mt-8 overflow-x-auto no-scrollbar pb-1">
              {['All','Espresso','Pour-Over','Signature Botanicals','Bakery'].map(c=><button key={c} onClick={()=>setFilter(c)} className={`btn-press shrink-0 rounded-full px-4 sm:px-5 py-2.5 font-mono2 text-[11px] tracking-[0.08em] border ${filter===c?'bg-[#C75B2A] border-[#C75B2A] text-white':'border-white/25 text-[#E8DDD0] hover:border-white'}`}>{c.toUpperCase()} {c!=='All' && `(${MENU.filter(m=>m.cat===c).length})`}</button>)}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {filtered.map(m=>(
                <article key={m.id} className="reveal card-hover bg-[#F4EFE8] text-[#131210] rounded-[20px] p-5 flex flex-col">
                  <div className="flex justify-between items-start gap-3"><span className="font-mono2 text-[10px] tracking-[0.16em] bg-[#1C2B23] text-[#F4EFE8] rounded-full px-3 py-1">{m.cat.toUpperCase()}</span>{m.tag && <span className="font-mono2 text-[10px] tracking-[0.12em] text-[#C75B2A] font-bold">{m.tag}</span>}</div>
                  <h3 className="font-display text-[24px] font-bold leading-tight mt-4 min-h-[62px]">{m.name}</h3>
                  <p className="font-mono2 text-[11px] tracking-[0.08em] text-[#131210]/60 mt-1">{m.origin}</p>
                  <p className="text-sm mt-3 text-[#131210]/75 italic">{m.notes}</p>
                  <div className="grid gap-2 mt-4"><Bars label="ACIDITY" value={m.acidity}/><Bars label="BODY" value={m.body}/><Bars label="SWEETNESS" value={m.sweet}/></div>
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#131210]/10"><span className="font-mono2 font-bold text-lg">{m.price} <span className="text-xs">EGP</span></span><button onClick={()=>addToCart({key:m.id, name:m.name, unit:m.price, detail:m.origin})} data-cursor="ADD +" className="btn-press bg-[#131210] text-[#F4EFE8] rounded-full px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5">ADD + <Plus size={15}/></button></div>
                </article>
              ))}
            </div>
            <p className="font-mono2 text-[11px] tracking-[0.14em] text-center mt-6 text-[#E8DDD0]/60">BAKERY SERVED UNTIL SOLD OUT • OAT MILK +15 EGP</p>
          </div>
        </section>

        {/* QUIZ */}
        <section id="quiz" className="bg-[#E8DDD0] text-[#131210] px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
            <div className="reveal"><SectionTag dark>03 — FLAVOR RECOMMENDER</SectionTag><h2 className="font-display font-black text-[clamp(38px,5vw,62px)] leading-[0.95] mt-4">Find your pour<br/>in <span className="italic font-light text-[#C75B2A]">three questions.</span></h2><p className="mt-4 text-[#131210]/70 leading-relaxed max-w-[420px]">No algorithm cosplay. Just mood, milk and appetite for the strange — then one honest recommendation.</p><div className="mt-6 flex items-center gap-2 font-mono2 text-[11px] tracking-[0.14em]"><Sparkles size={16} className="text-[#C75B2A]"/> ANSWERED: {[mood,milk,adventure].filter(Boolean).length} / 3</div></div>
            <div className="bg-[#F4EFE8] rounded-[22px] border border-[#131210]/12 p-5 sm:p-6 shadow-[0_18px_40px_rgba(19,18,16,0.10)]">
              {[
                {label:'1 — YOUR MOOD', val:mood, set:setMood, opts:['Bright','Cozy','Bold','Strange']},
                {label:'2 — MILK?', val:milk, set:setMilk, opts:['Black','Oat','Dairy']},
                {label:'3 — ADVENTURE', val:adventure, set:setAdventure, opts:['Classic','Botanical']},
              ].map(q=>(
                <div key={q.label} className="mb-5"><p className="font-mono2 text-[11px] tracking-[0.16em] font-bold">{q.label}</p><div className="flex flex-wrap gap-2 mt-2">{q.opts.map(o=><button key={o} onClick={()=>q.set(o)} className={`btn-press rounded-full px-4 py-2 text-sm border ${q.val===o?'bg-[#131210] text-white border-[#131210]':'bg-white border-[#131210]/15 hover:border-[#131210]'}`}>{o}</button>)}</div></div>
              ))}
              <button onClick={runQuiz} className="btn-press w-full bg-[#C75B2A] text-white rounded-full py-3.5 font-semibold">Reveal my pour →</button>
              {quizResult && <div id="quiz-result" className="rise mt-5 bg-[#1C2B23] text-[#F4EFE8] rounded-[18px] p-5"><div className="font-mono2 text-[10px] tracking-[0.18em] text-[#8A9A8B]">YOUR PRESCRIPTION</div><h3 className="font-display text-[26px] font-bold mt-2 leading-tight">{quizResult.name}</h3><p className="text-sm leading-relaxed mt-2 text-[#E8DDD0]/85">{why}</p><p className="font-mono2 text-xs mt-3">{quizResult.origin} • {quizResult.notes}</p><button onClick={()=>addToCart({key:quizResult.id, name:quizResult.name, unit:quizResult.price, detail:quizResult.origin})} className="btn-press mt-4 bg-[#F4EFE8] text-[#131210] rounded-full px-5 py-2.5 text-sm font-semibold">Add to tray — {quizResult.price} EGP</button></div>}
            </div>
          </div>
        </section>

        {/* ROASTERY */}
        <section id="roastery" className="bg-[#F4EFE8] text-[#131210] px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
          <div className="mx-auto max-w-[1360px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 reveal"><div><SectionTag dark>04 — ROASTERY & SUBSCRIPTIONS</SectionTag><h2 className="font-display font-black text-[clamp(40px,6vw,72px)] leading-[0.92] mt-4">Take the<br/><span className="italic font-light text-[#C75B2A]">roastery home.</span></h2></div><p className="max-w-[420px] text-[#131210]/70 leading-relaxed">250g whole-bean bags, roasted in small lots. Subscriptions save 10% and ship on roast day.</p></div>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              {BEANS.map(b=>(
                <article key={b.id} className="reveal card-hover bg-[#131210] text-[#F4EFE8] rounded-[22px] p-5 sm:p-6">
                  <div className="flex justify-between font-mono2 text-[10px] tracking-[0.14em] text-[#E8DDD0]/60"><span>250G • WHOLE BEAN</span><span>{b.roast}</span></div>
                  <div className="mt-6 h-[112px] rounded-[16px] bg-[#C75B2A] relative overflow-hidden flex items-end p-4"><span className="font-display font-black text-[28px] leading-none">{b.name}</span><span className="absolute right-4 top-3 font-display italic text-white/70 text-5xl">№</span></div>
                  <h3 className="font-display text-[22px] font-bold mt-4">{b.origin}</h3><p className="text-sm text-[#E8DDD0]/75 italic mt-1">{b.notes}</p>
                  <p className="font-mono2 text-[11px] tracking-[0.12em] mt-4">GRIND</p><div className="flex flex-wrap gap-1.5 mt-2">{['Whole Bean','Espresso','Filter','French Press'].map(g=><button key={g} onClick={()=>setGrinds(p=>({...p,[b.id]:g}))} className={`btn-press rounded-full px-3 py-1.5 text-[12px] border ${grinds[b.id]===g?'bg-[#F4EFE8] text-[#131210] border-[#F4EFE8]':'border-white/25 text-[#E8DDD0]'}`}>{g}</button>)}</div>
                  <p className="font-mono2 text-[11px] tracking-[0.12em] mt-4">FREQUENCY</p><div className="grid grid-cols-3 gap-1.5 mt-2">{['One-time','Every 2 Weeks','Monthly'].map(f=><button key={f} onClick={()=>setFreqs(p=>({...p,[b.id]:f}))} className={`btn-press rounded-full px-2 py-2 text-[11px] border leading-tight ${freqs[b.id]===f?'bg-[#C75B2A] border-[#C75B2A] text-white':'border-white/25 text-[#E8DDD0]'}`}>{f}{f!=='One-time'?' • −10%':''}</button>)}</div>
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/15"><div><span className="font-mono2 font-bold text-xl">{beanPrice(b)} EGP</span>{freqs[b.id]!=='One-time' && <span className="font-mono2 text-xs line-through text-white/50 ml-2">{b.price}</span>}<div className="font-mono2 text-[10px] text-[#E8DDD0]/60 mt-1">{grinds[b.id]} • {freqs[b.id].toUpperCase()}</div></div><button onClick={()=>addToCart({key:`bean-${b.id}-${grinds[b.id]}-${freqs[b.id]}`, name:`${b.name} — ${b.origin}`, unit:beanPrice(b), detail:`${grinds[b.id]} • ${freqs[b.id]}`})} className="btn-press bg-[#F4EFE8] text-[#131210] rounded-full px-4 py-2.5 text-sm font-semibold">Add to Tray</button></div>
                </article>
              ))}
            </div>
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[['01','Green','Sourced, rested, graded.'],['02','Roast','Loring S15, 27s development.'],['03','Rest','Nine days. No rushing.'],['04','Brew','94°C. Measured. Poured.']].map(([n,t,d])=><div key={n} className="border-t-2 border-[#C75B2A] pt-4"><div className="font-display italic text-[#C75B2A] text-2xl">{n}</div><h3 className="font-display font-bold text-xl mt-1">{t}</h3><p className="text-sm text-[#131210]/65 mt-1">{d}</p></div>)}
            </div>
            <div className="mt-10 bg-[#E8DDD0] rounded-[18px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><p className="font-display italic text-xl">Bakery on the counter, vinyl on the turntable. The rest is yours.</p><button onClick={()=>setCartOpen(true)} className="btn-press shrink-0 bg-[#131210] text-white rounded-full px-5 py-3 text-sm font-semibold">Review your tray →</button></div>
          </div>
        </section>

        {/* SPACE */}
        <section id="space" className="bg-[#131210] px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
          <div className="mx-auto max-w-[1360px]">
            <SectionTag>05 — THE SPACE</SectionTag>
            <h2 className="font-display font-black text-[clamp(40px,6vw,72px)] leading-[0.92] mt-4 max-w-[900px]">Concrete, light,<br/><span className="italic font-light">and 33rpm.</span></h2>
            <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-5 mt-8 items-stretch">
              <div className="relative overflow-hidden rounded-[20px] min-h-[340px]"><img src={spaceUrl} alt="Brutalist listening bar interior at MĀRA" className="absolute inset-0 w-full h-full object-cover"/><div className="absolute bottom-4 left-4 bg-[#F4EFE8] text-[#131210] rounded-full px-4 py-2 font-mono2 text-[11px] font-bold">FOUAD ST — AR CHED WINDOWS • CONCRETE • OAK</div></div>
              <div className="bg-[#1C2B23] rounded-[20px] p-5 sm:p-6 border border-white/10 flex flex-col justify-between"><div><div className="flex justify-between items-start"><span className="font-mono2 text-[10px] tracking-[0.18em] text-[#8A9A8B]">NOW PLAYING</span><span className="w-8 h-8 rounded-full border border-white/25 grid place-items-center"><Play size={13}/></span></div><h3 className="font-display text-[30px] leading-tight font-bold mt-4">Journey in<br/>Satchidananda</h3><p className="text-[#E8DDD0]/70 text-sm mt-2">Alice Coltrane — Side A, 33rpm</p></div><button onClick={toggleSound} className="btn-press mt-6 bg-[#C75B2A] rounded-full py-3 text-sm font-semibold">{sound?'Pause the room':'Play the room'}</button><p className="font-mono2 text-[10px] tracking-[0.14em] text-[#E8DDD0]/55 mt-3">VINYL SESSIONS THU–SAT • 19:00</p></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {[
                {t:'Architecture', d:'Brutalist concrete, arched Fouad St windows, oak counters and low light. Built for long mornings and slower evenings.'},
                {t:'Listening', d:'Vinyl sessions Thu–Sat at 7pm. Bring your own record. Headphones bar for deep listening, speakers for the room.'},
                {t:'Etiquette', d:'No laptops after 6pm Friday. Whisper bar after 8pm. 90-minute seating on weekends — stay, then make room.'},
              ].map(x=><article key={x.t} className="reveal bg-[#F4EFE8] text-[#131210] rounded-[18px] p-5"><h3 className="font-display font-bold text-[22px]">{x.t}</h3><p className="text-sm leading-relaxed mt-2 text-[#131210]/70">{x.d}</p></article>)}
            </div>
            <div className="mt-5 overflow-hidden rounded-[18px]"><img src={bakeryUrl} alt="Croissant and cardamom bun on a tray" className="w-full h-[240px] sm:h-[300px] object-cover"/></div>
            <p className="font-mono2 text-[10px] tracking-[0.16em] text-[#E8DDD0]/50 mt-3">FIG. 05 — BAKERY, BAKED 06:40 • CARDAMOM BUN + 36H CROISSANT</p>
          </div>
        </section>

        {/* VISIT / FOOTER */}
        <footer id="visit" className="bg-[#131210] border-t border-white/15 px-4 sm:px-6 lg:px-10 pt-16 pb-8">
          <div className="mx-auto max-w-[1360px]">
            <div className="grid lg:grid-cols-[1fr_1.1fr_0.9fr] gap-10">
              <div><SectionTag>06 — VISIT</SectionTag><h2 className="font-display font-black text-[clamp(36px,4.5vw,56px)] leading-[0.95] mt-4">Come<br/>thirsty.</h2><div className="mt-6 space-y-3 text-sm leading-relaxed text-[#E8DDD0]/85"><p className="flex gap-2"><MapPin size={16} className="text-[#C75B2A] shrink-0 mt-0.5"/>14 Fouad St, Alexandria, Egypt</p><p className="flex gap-2"><Clock size={16} className="text-[#C75B2A] shrink-0 mt-0.5"/>Mon–Sun 7:00–23:00<br/>Fri 13:00–00:00</p><p>hello@maracoffee.eg</p></div><div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 font-mono2 text-[11px]"><span className={`w-2 h-2 rounded-full ${isOpen?'bg-[#8A9A8B]':'bg-[#C75B2A]'}`}/>{isOpen?'OPEN NOW':'CLOSED • NEXT POUR 07:00'}</div></div>
              <div><h3 className="font-display text-[26px] font-bold">THE MORNING POUR</h3><p className="text-sm text-[#E8DDD0]/70 mt-2 leading-relaxed">One email a week. New lots, roast dates, and the Friday playlist. No noise.</p>
                <form onSubmit={subscribe} className="mt-4 flex gap-2"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" className="min-w-0 flex-1 rounded-full bg-white/10 border border-white/20 px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-[#C75B2A]"/><button disabled={newsState==='busy'} className="btn-press shrink-0 bg-[#C75B2A] rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60">{newsState==='busy'?'Saving…':'Join'}</button></form>
                {newsMsg && <p className={`mt-3 text-sm flex items-start gap-2 ${newsState==='done'?'text-[#8A9A8B]':'text-[#F4EFE8]'}`}>{newsState==='done' && <Check size={16} className="mt-0.5 shrink-0"/>}{newsMsg}</p>}
                <div className="mt-6 flex flex-wrap gap-2 font-mono2 text-[11px]"><a href="#manifesto" className="underline underline-offset-4 decoration-white/30">MANIFESTO</a><a href="#menu" className="underline underline-offset-4 decoration-white/30">MENU</a><a href="#roastery" className="underline underline-offset-4 decoration-white/30">ROASTERY</a><a href="#space" className="underline underline-offset-4 decoration-white/30">SPACE</a></div>
              </div>
              <div className="bg-[#1C2B23] rounded-[18px] p-5 border border-white/10 self-start"><div className="font-mono2 text-[10px] tracking-[0.18em] text-[#8A9A8B]">ALEXANDRIA — RIGHT NOW</div><div className="font-display text-[34px] font-black mt-3 leading-none">22°C <span className="text-lg font-light italic">• Golden hour light</span></div><p className="text-sm text-[#E8DDD0]/75 mt-3 leading-relaxed">Busy but soft. The corner table is free. The bar is pouring Yirgacheffe.</p><div className="mt-4 pt-4 border-t border-white/10 flex justify-between font-mono2 text-[10px] tracking-[0.12em] text-[#E8DDD0]/60"><span>HUMIDITY 61%</span><span>LIGHT: WARM</span><span>VIBE: SOFT</span></div></div>
            </div>
            <div className="mt-14 select-none overflow-hidden"><div className="font-display font-black leading-[0.78] tracking-[-0.04em] text-[clamp(92px,22vw,300px)] text-center">MĀRA<span className="text-[#C75B2A]">®</span></div></div>
            <div className="flex flex-col sm:flex-row justify-between gap-2 pt-6 border-t border-white/10 font-mono2 text-[10px] tracking-[0.14em] text-[#E8DDD0]/55"><span>© 2026 MĀRA — BOTANICAL ROASTERY & LISTENING BAR</span><span>FOUAD ST • ALEXANDRIA • EST. 2019</span></div>
          </div>
        </footer>
      </main>

      {/* CART DRAWER */}
      {cartOpen && <div className="fixed inset-0 z-[100]"><button aria-label="Close cart" onClick={()=>setCartOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"/><aside className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-[#F4EFE8] text-[#131210] shadow-2xl flex flex-col" role="dialog" aria-label="Your tray">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#131210]/10"><div><h2 className="font-display font-black text-2xl">Your Tray</h2><p className="font-mono2 text-[11px] tracking-[0.12em] text-[#131210]/55">{count} ITEM{count===1?'':'S'} • FOUAD ST PICKUP</p></div><button onClick={()=>setCartOpen(false)} aria-label="Close" className="btn-press w-9 h-9 grid place-items-center rounded-full border border-[#131210]/15"><X size={18}/></button></div>
        <div className="px-5 py-4 border-b border-[#131210]/10"><div className="flex justify-between font-mono2 text-[11px] tracking-[0.12em]"><span>{subtotal>=800?'FREE DELIVERY UNLOCKED':`FREE DELIVERY OVER 800 EGP`}</span><span>{subtotal} / 800</span></div><div className="h-2 bg-[#131210]/10 rounded-full mt-2 overflow-hidden"><div className="h-full bg-[#C75B2A] rounded-full transition-all" style={{width:`${progress}%`}}/></div></div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.length===0 && <div className="text-center py-14"><div className="font-display italic text-2xl">Your tray is empty.</div><p className="text-sm text-[#131210]/60 mt-2">Start with the Apothecary. It never misses.</p><button onClick={()=>{setCartOpen(false); document.getElementById('menu')?.scrollIntoView({behavior:'smooth'});}} className="btn-press mt-5 bg-[#131210] text-white rounded-full px-5 py-3 text-sm font-semibold">Browse the menu</button></div>}
          {cart.map(it=>(
            <div key={it.key} className="bg-white rounded-[16px] border border-[#131210]/10 p-4 flex gap-3"><div className="flex-1 min-w-0"><h3 className="font-display font-bold leading-tight">{it.name}</h3><p className="font-mono2 text-[10px] tracking-[0.08em] text-[#131210]/55 mt-1">{it.detail}</p><div className="flex items-center gap-2 mt-3"><button onClick={()=>changeQty(it.key,-1)} aria-label="Decrease quantity" className="btn-press w-7 h-7 grid place-items-center rounded-full border border-[#131210]/20"><Minus size={13}/></button><span className="font-mono2 font-bold text-sm w-6 text-center">{it.qty}</span><button onClick={()=>changeQty(it.key,1)} aria-label="Increase quantity" className="btn-press w-7 h-7 grid place-items-center rounded-full border border-[#131210]/20"><Plus size={13}/></button></div></div><div className="text-right shrink-0"><div className="font-mono2 font-bold">{it.unit*it.qty} EGP</div><button onClick={()=>removeItem(it.key)} aria-label={`Remove ${it.name}`} className="btn-press inline-flex items-center gap-1 text-xs text-[#131210]/55 mt-3"><Trash2 size={13}/> Remove</button></div></div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-[#131210]/10 bg-[#F2EDE6]"><div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono2 font-bold">{subtotal} EGP</span></div><div className="flex justify-between text-sm mt-1 text-[#131210]/60"><span>Delivery</span><span>{subtotal>=800?'FREE':'Calculated at pickup'}</span></div><button onClick={checkout} disabled={cart.length===0||checkoutBusy} className="btn-press mt-4 w-full bg-[#C75B2A] text-white rounded-full py-3.5 font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{checkoutBusy?'Placing order…':'Checkout'} <ArrowUpRight size={16}/></button><p className="text-center font-mono2 text-[10px] tracking-[0.12em] text-[#131210]/50 mt-3">PICKUP • 14 FOUAD ST • NO ACCOUNT NEEDED</p></div>
      </aside></div>}

      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[115] max-w-[calc(100vw-32px)] bg-[#131210] text-[#F4EFE8] border border-white/20 rounded-full px-5 py-3 text-sm font-medium shadow-2xl flex items-center gap-2"><Check size={16} className="text-[#8A9A8B] shrink-0"/><span className="truncate">{toast}</span></div>}
    </div>
  );
}
