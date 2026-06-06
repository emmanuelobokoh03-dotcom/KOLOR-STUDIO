import { useEffect, useRef, useState, useCallback } from 'react'

// Timeline events — real commission in Naira (James Okafor, Lagos)
const TL_EVENTS = [
  { dot: 'done', label: 'Inquiry received', sub: 'Apr 3, 2026', connector: true },
  { dot: 'done', label: 'Offer sent \u2014 \u20a6850,000', sub: 'Accepted Apr 5', connector: true },
  { dot: 'done', label: 'Commission agreement signed', sub: 'Apr 6, 2026', connector: true },
  { dot: 'done', label: 'Deposit received \u2014 \u20a6425,000', sub: '50% \u00b7 Apr 7, 2026', connector: true },
  { dot: 'warn', label: 'Delivery date approaching', sub: 'Jun 30, 2026 \u00b7 25 days', chip: 'Final payment on delivery', connector: true, warn: true },
  { dot: 'pending', label: 'Final payment \u00b7 \u20a6425,000', sub: 'On delivery', connector: false, muted: true },
]

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
const EASE_SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export default function LandingPageV2() {
  const scrollTargetRef = useRef(0)
  const scrollCurrentRef = useRef(0)
  const rafRef = useRef<number>(0)
  const [displayScrollY, setDisplayScrollY] = useState(0)
  const [navScrolled, setNavScrolled] = useState(false)

  const [priceCount, setPriceCount] = useState(0)
  const [priceCounted, setPriceCounted] = useState(false)
  const [tlVisible, setTlVisible] = useState(false)
  const [lossVisible, setLossVisible] = useState(false)
  const [indVisible, setIndVisible] = useState(false)
  const [heroReady, setHeroReady] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifySubmitted, setNotifySubmitted] = useState(false)
  const [notifyLoading, setNotifyLoading] = useState(false)

  const priceRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<HTMLDivElement>(null)
  const lossRef = useRef<HTMLDivElement>(null)
  const indRef = useRef<HTMLDivElement>(null)
  const kRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const btn1Ref = useRef<HTMLAnchorElement>(null)
  const btn2Ref = useRef<HTMLAnchorElement>(null)
  const btn3Ref = useRef<HTMLAnchorElement>(null)
  const btn4Ref = useRef<HTMLAnchorElement>(null)

  const tickScroll = useCallback(() => {
    const current = scrollCurrentRef.current
    const target = scrollTargetRef.current
    const next = current + (target - current) * 0.08
    scrollCurrentRef.current = next
    setDisplayScrollY(next)
    if (Math.abs(target - next) > 0.1) {
      rafRef.current = requestAnimationFrame(tickScroll)
    }
  }, [])

  useEffect(() => {
    document.title = 'KOLOR Studio \u2014 Studio management for independent creatives'
    const t = setTimeout(() => setHeroReady(true), 60)

    const onScroll = () => {
      const y = window.scrollY
      scrollTargetRef.current = y
      setNavScrolled(y > 40)
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(tickScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
      clearTimeout(t)
    }
  }, [tickScroll])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.target === priceRef.current && e.isIntersecting && !priceCounted) {
          setPriceCounted(true)
          let start: number | null = null
          const run = (ts: number) => {
            if (!start) start = ts
            const p = Math.min((ts - start) / 700, 1)
            const ease = 1 - Math.pow(1 - p, 3)
            setPriceCount(Math.round(ease * 97))
            if (p < 1) requestAnimationFrame(run)
            else setPriceCount(97)
          }
          requestAnimationFrame(run)
        }
        if (e.target === tlRef.current && e.isIntersecting) setTlVisible(true)
        if (e.target === lossRef.current && e.isIntersecting) setLossVisible(true)
        if (e.target === indRef.current && e.isIntersecting) setIndVisible(true)
      })
    }, { threshold: 0.15 })
    ;[priceRef, tlRef, lossRef, indRef].forEach(r => r.current && obs.observe(r.current))
    return () => obs.disconnect()
  }, [priceCounted])

  const heroH = typeof window !== 'undefined' ? window.innerHeight : 800
  const kRotation = Math.min(displayScrollY / heroH, 1) * 3

  const docH = typeof document !== 'undefined' ? document.documentElement.scrollHeight : 4000
  const prog = Math.min(displayScrollY / (docH * 0.3), 1)
  const bl = Math.round(prog * 10)
  const bgColor = `rgb(${14 + bl},${12 + bl},${20 + bl})`

  const magnetMove = (e: React.MouseEvent, ref: React.RefObject<HTMLAnchorElement>) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) / r.width * 5
    const y = (e.clientY - r.top - r.height / 2) / r.height * 5
    ref.current.style.transform = `translate(${x}px,${y}px)`
    ref.current.style.transition = 'none'
  }
  const magnetLeave = (ref: React.RefObject<HTMLAnchorElement>) => {
    if (!ref.current) return
    ref.current.style.transform = ''
    ref.current.style.transition = `transform 0.5s ${EASE_OUT}`
  }

  const handleNotify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!notifyEmail.trim() || notifySubmitted) return
    setNotifyLoading(true)
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || ''
      await fetch(`${apiUrl}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail.trim() }),
      })
    } catch { /* silent */ }
    setNotifyLoading(false)
    setNotifySubmitted(true)
  }

  const CSS = `
    :root {
      --ink: #0E0C14;
      --ink-mid: #181424;
      --ink-light: #231E36;
      --cream: #F5F0E8;
      --cream-dim: rgba(245,240,232,.52);
      --cream-muted: rgba(245,240,232,.26);
      --cream-ghost: rgba(245,240,232,.07);
      --brand: #6C2EDB;
      --brand-light: #9B6AEF;
      --amber: #E8891A;
      --amber-dim: rgba(232,137,26,.14);
      --red: #A32D2D;
      --green: #3B6D11;
      --bg-ghost: rgba(245,240,232,.07);
      --bg-faint: rgba(245,240,232,.12);
      --bg-mid: rgba(245,240,232,.18);
      --ease-out: cubic-bezier(0.16,1,0.3,1);
      --ease-settle: cubic-bezier(0.22,1,0.36,1);
      --ease-spring: cubic-bezier(0.34,1.56,0.64,1);
    }
    .lp { font-family:'DM Sans',-apple-system,sans-serif; overflow-x:hidden; color:var(--cream); }
    .lp::after { content:''; position:fixed; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"); pointer-events:none; z-index:9999; }
    .lp-nav { position:fixed; top:0; left:0; right:0; z-index:200; padding:22px 48px; display:flex; align-items:center; justify-content:space-between; transition:background .5s,border-color .5s,backdrop-filter .5s; border-bottom:.5px solid transparent; }
    .lp-nav.sc { background:rgba(14,12,20,.88); backdrop-filter:blur(20px) saturate(1.4); border-color:var(--bg-ghost); }
    .lp-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
    .lp-mark { width:28px; height:28px; background:var(--brand); border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .lp-wm { font-family:'DM Mono',monospace; font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--cream); }
    .lp-nb { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--cream); padding:10px 22px; border:.5px solid var(--bg-mid); border-radius:3px; text-decoration:none; display:inline-block; transition:background .2s,border-color .2s; }
    .lp-nb:hover { background:rgba(245,240,232,.06); border-color:var(--cream); }
    .lp-hero { min-height:100svh; display:flex; flex-direction:column; justify-content:center; padding:120px 48px 80px; position:relative; overflow:hidden; }
    .lp-kbg { position:absolute; right:-2vw; top:50%; font-family:'Fraunces',serif; font-style:italic; font-weight:900; font-size:clamp(300px,40vw,640px); line-height:1; color:transparent; -webkit-text-stroke:.5px rgba(245,240,232,.04); pointer-events:none; user-select:none; letter-spacing:-.06em; z-index:0; will-change:transform; }
    .lp-hi { max-width:1120px; width:100%; margin:0 auto; display:grid; grid-template-columns:1fr 320px; gap:64px; align-items:end; position:relative; z-index:1; }
    .lp-line-mask { overflow:hidden; display:block; }
    .lp-h1 { font-family:'Fraunces',serif; font-weight:800; font-style:italic; font-size:clamp(56px,8.5vw,118px); line-height:.92; letter-spacing:-.035em; color:var(--cream); }
    .lp-word { display:inline-block; transform:translateY(110%); }
    .lp-word.solid { transition:transform 0s; }
    .lp-word.ol { color:transparent; -webkit-text-stroke:1px var(--cream-dim); letter-spacing:0.5em; transition:transform 0s, letter-spacing 0s; }
    .lp-word.ready { transform:translateY(0); transition:transform 800ms var(--ease-out) !important; }
    .lp-word.ol.ready { letter-spacing:-.035em; transition:transform 1000ms var(--ease-settle) !important, letter-spacing 1000ms var(--ease-settle) !important; }
    .lp-ey { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:var(--brand-light); display:flex; align-items:center; gap:10px; margin-bottom:32px; opacity:0; transform:translateY(14px); transition:opacity 600ms var(--ease-out), transform 600ms var(--ease-out); }
    .lp-ey::before { content:''; display:block; width:28px; height:.5px; background:var(--brand-light); }
    .lp-ey.ready { opacity:1; transform:translateY(0); }
    .lp-aside { display:flex; flex-direction:column; justify-content:flex-end; gap:24px; padding-bottom:6px; opacity:0; transform:translateY(20px); transition:opacity 800ms var(--ease-out) 1.3s, transform 800ms var(--ease-out) 1.3s; }
    .lp-aside.ready { opacity:1; transform:translateY(0); }
    .lp-desc { font-size:15px; line-height:1.72; color:var(--cream-dim); font-weight:300; }
    .lp-desc strong { color:var(--cream); font-weight:500; }
    .lp-btn { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:var(--ink); background:var(--cream); padding:14px 26px; border-radius:3px; text-decoration:none; display:inline-block; align-self:flex-start; will-change:transform; }
    .lp-btn:hover { background:#fffdf7; }
    .lp-note { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.08em; color:var(--amber); }
    .lp-sh { position:absolute; bottom:40px; left:48px; font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--cream-muted); display:flex; align-items:center; gap:10px; opacity:0; transition:opacity 1s var(--ease-out) 1.8s; }
    .lp-sh::after { content:''; display:block; width:40px; height:.5px; background:var(--cream-muted); }
    .lp-sh.ready { opacity:1; }
    .lp-s { padding:120px 48px; }
    .lp-ss { padding:0 48px 120px; }
    .lp-in { max-width:1120px; margin:0 auto; }
    .lp-lbl { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:var(--cream-muted); display:flex; align-items:center; gap:8px; margin-bottom:20px; }
    .lp-lbl::before { content:''; display:block; width:14px; height:.5px; background:currentColor; }
    .lp-sh2 { font-family:'Fraunces',serif; font-weight:700; font-size:clamp(34px,4.5vw,60px); line-height:1.02; letter-spacing:-.025em; color:var(--cream); }
    .lp-sh2 em { font-style:italic; color:var(--red); }
    .lp-bt { border-top:.5px solid var(--bg-ghost); padding-top:72px; }
    .lp-rv { opacity:0; transform:translateY(28px); transition:opacity .8s var(--ease-out), transform .8s var(--ease-out); }
    .lp-rv.vis { opacity:1; transform:translateY(0); }
    .lp-rv.d1 { transition-delay:.1s; }
    .lp-rv.d2 { transition-delay:.2s; }
    .lp-lt { display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:end; margin-bottom:72px; }
    .lp-lb { font-size:15px; line-height:1.75; color:var(--cream-dim); font-weight:300; padding-top:12px; border-top:.5px solid var(--bg-ghost); }
    .lp-lg { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--bg-ghost); border:.5px solid var(--bg-ghost); }
    .lp-lc { background:var(--ink); padding:40px 32px; opacity:0; transition:background .3s; }
    .lp-lc.fl { transform:translateX(-32px); transition:opacity .7s var(--ease-out), transform .7s var(--ease-out), background .3s; }
    .lp-lc.fc { transform:translateY(24px); transition:opacity .7s .13s var(--ease-out), transform .7s .13s var(--ease-out), background .3s; }
    .lp-lc.fr { transform:translateX(32px); transition:opacity .7s .26s var(--ease-out), transform .7s .26s var(--ease-out), background .3s; }
    .lp-lc.vis { opacity:1; transform:none; }
    .lp-lc:hover { background:var(--ink-mid); }
    .lp-ln { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.14em; color:var(--cream-muted); margin-bottom:28px; }
    .lp-lq { font-family:'Fraunces',serif; font-weight:400; font-style:italic; font-size:20px; line-height:1.45; color:var(--cream); margin-bottom:20px; }
    .lp-la { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--cream-muted); }
    .lp-ih { padding-top:72px; margin-bottom:64px; display:flex; align-items:flex-end; justify-content:space-between; gap:40px; flex-wrap:wrap; position:relative; overflow:hidden; }
    .lp-ih::before { content:''; position:absolute; top:0; left:0; height:.5px; width:100%; background:var(--bg-faint); transform:scaleX(0); transform-origin:left; transition:transform .65s var(--ease-out); }
    .lp-ih.lv::before { transform:scaleX(1); }
    .lp-in-note { font-family:'DM Mono',monospace; font-size:11px; letter-spacing:.08em; color:var(--cream-muted); max-width:220px; text-align:right; line-height:1.65; }
    .lp-panels { display:grid; grid-template-columns:1.45fr 1fr 1fr; border:.5px solid var(--bg-faint); }
    .lp-panel { padding:52px 40px; border-right:.5px solid var(--bg-faint); opacity:0; transition:background .3s var(--ease-out), transform .25s var(--ease-spring), opacity .7s var(--ease-out); }
    .lp-panel.vis { opacity:1; }
    .lp-panel:last-child { border-right:none; }
    .lp-panel.ft { background:var(--ink-mid); }
    .lp-panel:hover { background:var(--ink-light); transform:translateY(-2px); }
    .lp-tag { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.18em; text-transform:uppercase; padding:4px 9px; border-radius:2px; display:inline-block; margin-bottom:28px; color:var(--cream-muted); border:.5px solid var(--bg-faint); }
    .lp-tag.oc { background:var(--brand); border-color:var(--brand); color:#fff; }
    .lp-in-name { font-family:'Fraunces',serif; font-weight:700; font-size:clamp(24px,2.8vw,36px); line-height:1; letter-spacing:-.02em; color:var(--cream); margin-bottom:14px; }
    .lp-in-pain { font-size:13px; line-height:1.72; color:var(--cream-dim); font-weight:300; margin-bottom:32px; }
    .lp-il { list-style:none; display:flex; flex-direction:column; gap:9px; }
    .lp-il li { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.06em; color:var(--cream-muted); display:flex; align-items:center; gap:9px; }
    .lp-il li::before { content:''; display:block; width:3px; height:3px; border-radius:50%; background:var(--brand-light); flex-shrink:0; }
    .lp-ph { display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:start; margin-bottom:56px; }
    .lp-flow { display:flex; flex-direction:column; }
    .lp-fs { display:flex; align-items:flex-start; gap:18px; padding:18px 0; border-bottom:.5px solid var(--bg-ghost); }
    .lp-fs:last-child { border-bottom:none; }
    .lp-fn { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.12em; color:var(--cream-muted); flex-shrink:0; padding-top:2px; width:22px; }
    .lp-fl { font-size:13px; font-weight:500; color:var(--cream); margin-bottom:2px; }
    .lp-fd { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.05em; color:var(--cream-muted); line-height:1.5; }
    .lp-mock { background:var(--ink-mid); border:.5px solid var(--bg-mid); border-radius:5px; overflow:hidden; }
    .lp-mhd { background:rgba(245,240,232,.03); padding:14px 20px; border-bottom:.5px solid var(--bg-ghost); display:flex; align-items:center; justify-content:space-between; }
    .lp-mcl { display:flex; align-items:center; gap:10px; }
    .lp-mav { width:26px; height:26px; border-radius:50%; background:var(--brand); display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:9px; color:#fff; flex-shrink:0; }
    .lp-mn { font-size:12px; font-weight:500; color:var(--cream); }
    .lp-mm { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.05em; color:var(--cream-muted); }
    .lp-mb { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:#3B6D11; background:rgba(59,109,17,.12); padding:3px 8px; border-radius:2px; }
    .lp-mtl { padding:18px 20px; display:flex; flex-direction:column; }
    .lp-ev { display:flex; gap:12px; }
    .lp-dc { display:flex; flex-direction:column; align-items:center; flex-shrink:0; width:14px; }
    .lp-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; margin-top:3px; opacity:0; }
    .lp-dot.done { background:rgba(59,109,17,.85); }
    .lp-dot.warn { background:var(--amber); }
    .lp-dot.pending { background:transparent; border:.5px dashed rgba(245,240,232,.2); }
    .lp-conn { flex:1; width:.5px; background:var(--bg-ghost); min-height:20px; transform:scaleY(0); transform-origin:top; }
    .lp-ec { padding-bottom:18px; flex:1; }
    .lp-el { font-size:11px; font-weight:500; color:var(--cream); line-height:1.3; margin-bottom:2px; opacity:0; transform:translateX(-8px); }
    .lp-el.wc { color:var(--amber); }
    .lp-el.mc { color:var(--cream-muted); }
    .lp-es { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.04em; color:var(--cream-muted); }
    .lp-es.wc { color:rgba(232,137,26,.65); }
    .lp-chip { display:inline-flex; align-items:center; font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.06em; text-transform:uppercase; padding:3px 7px; border-radius:2px; margin-top:5px; background:var(--amber-dim); color:var(--amber); }
    .lp-pg { display:grid; grid-template-columns:1fr 1fr; border:.5px solid var(--bg-faint); margin-top:56px; }
    .lp-pl { padding:56px 48px; border-right:.5px solid var(--bg-faint); display:flex; flex-direction:column; justify-content:space-between; }
    .lp-plh { font-family:'Fraunces',serif; font-weight:700; font-size:clamp(28px,3.5vw,48px); line-height:1.04; letter-spacing:-.022em; color:var(--cream); margin-bottom:20px; }
    .lp-plb { font-size:14px; line-height:1.75; color:var(--cream-dim); font-weight:300; }
    .lp-pills { display:flex; gap:7px; flex-wrap:wrap; margin-top:32px; }
    .lp-pill { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.09em; color:var(--cream-muted); padding:5px 10px; border:.5px solid var(--bg-ghost); border-radius:2px; }
    .lp-pr { padding:56px 48px; background:var(--ink-mid); display:flex; flex-direction:column; }
    .lp-fb { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.16em; text-transform:uppercase; color:var(--amber); background:var(--amber-dim); padding:5px 10px; border-radius:2px; display:inline-block; margin-bottom:28px; align-self:flex-start; }
    .lp-pn { font-family:'Fraunces',serif; font-weight:800; font-size:80px; line-height:1; color:var(--cream); letter-spacing:-.045em; margin-bottom:6px; }
    .lp-ps { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; color:var(--cream-muted); margin-bottom:36px; }
    .lp-feat { list-style:none; display:flex; flex-direction:column; gap:11px; margin-bottom:36px; flex:1; }
    .lp-feat li { font-size:13px; color:var(--cream-dim); font-weight:300; display:flex; align-items:flex-start; gap:10px; }
    .lp-feat li::before { content:''; display:block; width:3px; height:3px; border-radius:50%; background:var(--brand-light); flex-shrink:0; margin-top:7px; }
    .lp-pcta { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:var(--ink); background:var(--cream); padding:14px 28px; border-radius:3px; text-decoration:none; display:block; text-align:center; will-change:transform; }
    .lp-pcta:hover { background:#fffdf7; }
    .lp-gi { max-width:1120px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
    .lp-rows { display:flex; flex-direction:column; border:.5px solid var(--bg-faint); }
    .lp-row { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:.5px solid var(--bg-ghost); transition:background .2s; }
    .lp-row:last-child { border-bottom:none; }
    .lp-row:hover { background:var(--ink-mid); }
    .lp-mkt { font-size:13px; color:var(--cream); }
    .lp-det { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.1em; color:var(--cream-muted); }
    .lp-ci { max-width:1120px; margin:0 auto; border:.5px solid var(--bg-faint); padding:100px 72px; text-align:center; position:relative; overflow:hidden; }
    .lp-ci::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 50% 0%,rgba(108,46,219,.16) 0%,transparent 65%); pointer-events:none; }
    .lp-ch { font-family:'Fraunces',serif; font-weight:800; font-style:italic; font-size:clamp(36px,5.5vw,80px); line-height:.95; letter-spacing:-.03em; color:var(--cream); margin-bottom:32px; position:relative; }
    .lp-csub { font-size:15px; line-height:1.7; color:var(--cream-dim); font-weight:300; max-width:420px; margin:0 auto 16px; position:relative; }
    .lp-clist { list-style:none; margin:0 auto 44px; max-width:340px; display:flex; flex-direction:column; gap:8px; position:relative; }
    .lp-clist li { font-size:14px; color:var(--cream-dim); font-weight:300; }
    .lp-clist li strong { color:var(--cream); font-weight:500; }
    .lp-cbtn { font-family:'DM Mono',monospace; font-size:12px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:var(--ink); background:var(--cream); padding:18px 40px; border-radius:3px; text-decoration:none; display:inline-block; position:relative; will-change:transform; }
    .lp-cbtn:hover { background:#fffdf7; }
    .lp-cnote { margin-top:18px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em; color:var(--amber); position:relative; }
    .lp-footer { border-top:.5px solid var(--bg-ghost); padding:32px 48px; display:flex; align-items:center; justify-content:space-between; max-width:1216px; margin:0 auto; flex-wrap:wrap; gap:16px; }
    .lp-flt { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--cream-muted); }
    .lp-fr { display:flex; gap:24px; }
    .lp-fl { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--cream-muted); text-decoration:none; transition:color .2s; }
    .lp-fl:hover { color:var(--cream); }
    @media(max-width:960px){
      .lp-nav{padding:16px 24px}
      .lp-hero{padding:110px 24px 64px}
      .lp-hi{grid-template-columns:1fr;gap:36px}
      .lp-kbg{display:none}
      .lp-sh{left:24px}
      .lp-s,.lp-ss{padding-left:24px;padding-right:24px}
      .lp-lt{grid-template-columns:1fr;gap:32px}
      .lp-lg{grid-template-columns:1fr}
      .lp-in-note{text-align:left;max-width:none}
      .lp-panels{grid-template-columns:1fr}
      .lp-panel{border-right:none;border-bottom:.5px solid var(--bg-faint)}
      .lp-panel:last-child{border-bottom:none}
      .lp-ph{grid-template-columns:1fr;gap:36px}
      .lp-mock-grid{grid-template-columns:1fr!important}
      .lp-pg{grid-template-columns:1fr}
      .lp-pl{border-right:none;border-bottom:.5px solid var(--bg-faint)}
      .lp-gi{grid-template-columns:1fr;gap:40px}
      .lp-ci{padding:56px 28px}
      .lp-footer{padding:28px 24px}
    }
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  `

  const MARK = (
    <svg width="14" height="14" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 4L22 10H10L16 4Z" fill="rgba(255,255,255,.5)"/>
      <path d="M16 4L10 10V4H16Z" fill="rgba(255,255,255,.9)"/>
      <path d="M28 16L22 10V22L28 16Z" fill="rgba(255,255,255,.35)"/>
      <path d="M28 16L22 22H28V16Z" fill="rgba(255,255,255,.7)"/>
      <path d="M16 28L10 22H22L16 28Z" fill="rgba(255,255,255,.5)"/>
      <path d="M16 28L22 22V28H16Z" fill="rgba(255,255,255,.9)"/>
      <path d="M4 16L10 22V10L4 16Z" fill="rgba(255,255,255,.35)"/>
      <path d="M4 16L10 10H4V16Z" fill="rgba(255,255,255,.7)"/>
    </svg>
  )

  const getTlDotDelay = (i: number) => i * 240 + 200
  const getTlLabelDelay = (i: number) => getTlDotDelay(i) + 60
  const getTlConnDelay = (i: number) => getTlDotDelay(i) + 160

  return (
    <div className="lp" style={{ background: bgColor }}>
      <style>{CSS}</style>

      <nav className={`lp-nav${navScrolled ? ' sc' : ''}`}>
        <a href="/" className="lp-logo" aria-label="KOLOR Studio home">
          <div className="lp-mark">{MARK}</div>
          <span className="lp-wm">Kolor Studio</span>
        </a>
        <a
          href="#pricing" className="lp-nb"
          ref={btn1Ref}
          onMouseMove={e => magnetMove(e, btn1Ref)}
          onMouseLeave={() => magnetLeave(btn1Ref)}
        >Get access</a>
      </nav>

      <section className="lp-hero" ref={heroRef} aria-labelledby="lp-h1">
        <div
          className="lp-kbg" ref={kRef} aria-hidden="true"
          style={{ transform: `translateY(-54%) rotate(${kRotation}deg)` }}
        >K</div>
        <div className="lp-hi">
          <div>
            <div className={`lp-ey${heroReady ? ' ready' : ''}`} aria-hidden="true">
              Studio management for independent creatives
            </div>
            <h1 className="lp-h1" id="lp-h1">
              <span className="lp-line-mask">
                <span className={`lp-word solid w1${heroReady ? ' ready' : ''}`} style={{ transitionDelay: '0.28s' }}>Your</span>
                {' '}
                <span className={`lp-word solid w2${heroReady ? ' ready' : ''}`} style={{ transitionDelay: '0.38s' }}>talent</span>
                {' '}
                <span className={`lp-word solid w3${heroReady ? ' ready' : ''}`} style={{ transitionDelay: '0.48s' }}>is</span>
                {' '}
                <span className={`lp-word solid w4${heroReady ? ' ready' : ''}`} style={{ transitionDelay: '0.58s' }}>exceptional.</span>
              </span>
              <br />
              <span className="lp-line-mask">
                <span className={`lp-word solid w5${heroReady ? ' ready' : ''}`} style={{ transitionDelay: '0.72s' }}>Your</span>
                {' '}
                <span className={`lp-word solid w6${heroReady ? ' ready' : ''}`} style={{ transitionDelay: '0.82s' }}>admin</span>
                {' '}
                <span className={`lp-word solid w7${heroReady ? ' ready' : ''}`} style={{ transitionDelay: '0.92s' }}>is</span>
              </span>
              <br />
              <span className="lp-line-mask">
                <span
                  className={`lp-word ol${heroReady ? ' ready' : ''}`}
                  style={{ transitionDelay: '1.1s' }}
                >losing you money.</span>
              </span>
            </h1>
          </div>
          <aside className={`lp-aside${heroReady ? ' ready' : ''}`}>
            <p className="lp-desc">
              Built for creatives who aren't based in America &mdash;
              and tired of tools that act like they should be.
              <strong> Quotes, contracts, and client portals</strong> in one place,
              in your currency, on your terms.
            </p>
            <a
              href="#pricing" className="lp-btn"
              ref={btn2Ref}
              onMouseMove={e => magnetMove(e, btn2Ref)}
              onMouseLeave={() => magnetLeave(btn2Ref)}
            >Claim your studio</a>
            <p className="lp-note">$97 &middot; one-time &middot; 10 studios only</p>
          </aside>
        </div>
        <div className={`lp-sh${heroReady ? ' ready' : ''}`} aria-hidden="true">Scroll</div>
      </section>

      <section className="lp-s" aria-labelledby="lp-loss-h">
        <div className="lp-in">
          <div className={`lp-lt lp-rv${lossVisible ? ' vis' : ''}`} ref={lossRef}>
            <div>
              <div className="lp-lbl" aria-hidden="true">The problem</div>
              <h2 className="lp-sh2" id="lp-loss-h">
                Your work is<br />exceptional.<br />
                Your admin is<br /><em>costing you clients.</em>
              </h2>
            </div>
            <p className="lp-lb">
              Most studio tools were built in America, for Americans. They assume
              your clients pay in dollars, your contracts follow US law, and your
              practice looks like everyone else&apos;s. So you&apos;ve been making
              do &mdash; with DMs, spreadsheets, and goodwill.
            </p>
          </div>
          <div className="lp-lg" role="list">
            <div className={`lp-lc fl${lossVisible ? ' vis' : ''}`} role="listitem">
              <div className="lp-ln">01 &mdash; Photography</div>
              <p className="lp-lq">&ldquo;She agreed to the shoot over WhatsApp. Then disputed the price. I had nothing in writing.&rdquo;</p>
              <div className="lp-la">Lagos, Nigeria</div>
            </div>
            <div className={`lp-lc fc${lossVisible ? ' vis' : ''}`} role="listitem">
              <div className="lp-ln">02 &mdash; Design</div>
              <p className="lp-lq">&ldquo;Three rounds of revisions, no scope agreement. I did the work. He paid half.&rdquo;</p>
              <div className="lp-la">London, United Kingdom</div>
            </div>
            <div className={`lp-lc fr${lossVisible ? ' vis' : ''}`} role="listitem">
              <div className="lp-ln">03 &mdash; Fine Art</div>
              <p className="lp-lq">&ldquo;The commission was &euro;4,000. They disappeared after the first email. No contract. No deposit.&rdquo;</p>
              <div className="lp-la">Berlin, Germany</div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-ss" aria-labelledby="lp-ind-h">
        <div className="lp-in">
          <div className={`lp-ih lp-rv${indVisible ? ' lv' : ''}`} ref={indRef}>
            <div>
              <div className="lp-lbl" aria-hidden="true">Built equally for three industries</div>
              <h2 className="lp-sh2" id="lp-ind-h" style={{ fontSize: 'clamp(30px,3.8vw,52px)' }}>
                Photography. Design.<br />Fine Art.<br />
                Built for all three &mdash;<br />not bolted on.
              </h2>
            </div>
            <p className="lp-in-note">
              Every tool uses the right language for your practice.
              Commissions, shoots, projects &mdash; KOLOR adapts to you.
            </p>
          </div>
          <div className="lp-panels">
            <div className={`lp-panel ft${indVisible ? ' vis' : ''}`} style={{ transitionDelay: '0.5s' }}>
              <div className="lp-tag oc">No one else built this for you</div>
              <div className="lp-in-name">Fine Art</div>
              <p className="lp-in-pain">
                Your commission gets a contract the moment it&apos;s agreed.
                Your collector gets a portal. Your deposit is protected before
                a single brushstroke. Built for working artists &mdash; not for institutions.
              </p>
              <ul className="lp-il">
                <li>Commission agreements</li>
                <li>Collector portals</li>
                <li>Delivery date tracking</li>
                <li>Instalment payment plans</li>
              </ul>
            </div>
            <div className={`lp-panel${indVisible ? ' vis' : ''}`} style={{ transitionDelay: '0.62s' }}>
              <div className="lp-tag">Photography</div>
              <div className="lp-in-name">Photography</div>
              <p className="lp-in-pain">
                From first enquiry to final gallery. Shoot date contracts
                and instant client portals that close the loop.
              </p>
              <ul className="lp-il">
                <li>Shoot date contracts</li>
                <li>Client portals</li>
                <li>File delivery</li>
                <li>Deposit automation</li>
              </ul>
            </div>
            <div className={`lp-panel${indVisible ? ' vis' : ''}`} style={{ transitionDelay: '0.74s' }}>
              <div className="lp-tag">Design</div>
              <div className="lp-in-name">Design</div>
              <p className="lp-in-pain">
                Scope agreements and milestone payments &mdash;
                without the spreadsheet, without the scope creep.
              </p>
              <ul className="lp-il">
                <li>Scope agreements</li>
                <li>Milestone billing</li>
                <li>Revision tracking</li>
                <li>Project timelines</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-ss" aria-label="User testimonial">
        <div className="lp-in">
          <div className="lp-rv" style={{
            borderTop: '.5px solid var(--bg-ghost)',
            borderBottom: '.5px solid var(--bg-ghost)',
            padding: '56px 0',
          }}>
            <div className="lp-ph" style={{ marginBottom: 0, alignItems: 'center' }}>
              <div>
                <div className="lp-lbl" aria-hidden="true">From a beta user</div>
                <blockquote style={{
                  fontFamily: "'Fraunces', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(20px, 2.4vw, 28px)',
                  lineHeight: 1.4,
                  letterSpacing: '-.015em',
                  color: 'var(--cream)',
                  margin: 0,
                }}>
                  &ldquo;Before this, I was managing clients through DMs, sending
                  invoices manually, jumping between tools just to stay on top of
                  one project. Now everything happens in one place. I can follow
                  up with clients seamlessly &mdash; almost with one tap.&rdquo;
                </blockquote>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '.04em',
                  color: 'var(--cream)',
                }}>Eylem Yentur</div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--cream-muted)',
                }}>Designer &middot; Berlin, Germany</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-ss" aria-labelledby="lp-prod-h">
        <div className="lp-in lp-bt">
          <div className="lp-ph lp-rv">
            <h2 className="lp-sh2" id="lp-prod-h" style={{ fontSize: 'clamp(30px,3.8vw,52px)' }}>
              From their first message<br />to your final payment.
            </h2>
            <div className="lp-flow">
              {[
                ['01', 'Client enquires', 'Via your public form or added manually'],
                ['02', 'Send a quote', 'Line items, deposit %, payment schedule'],
                ['03', 'Sign the agreement', 'Auto-generated from your quote \u2014 signed online'],
                ['04', 'Collect the deposit', 'Stripe or Paystack \u2014 any currency'],
                ['05', 'Deliver and get paid', 'Client portal \u00b7 files \u00b7 final payment'],
              ].map(([n, l, d]) => (
                <div key={n} className="lp-fs">
                  <span className="lp-fn">{n}</span>
                  <div><div className="lp-fl">{l}</div><div className="lp-fd">{d}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-mock-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
          <div
            className="lp-mock lp-rv d2" ref={tlRef}
            role="img" aria-label="KOLOR client journey timeline for James Okafor fine art commission"
          >
            <div className="lp-mhd">
              <div className="lp-mcl">
                <div className="lp-mav" aria-hidden="true">JO</div>
                <div>
                  <div className="lp-mn">James Okafor</div>
                  <div className="lp-mm">Fine Art Commission &middot; &#8358;850,000</div>
                </div>
              </div>
              <div className="lp-mb">In progress</div>
            </div>
            <div className="lp-mtl">
              {TL_EVENTS.map((ev, i) => (
                <div key={i} className="lp-ev">
                  <div className="lp-dc">
                    <div
                      className={`lp-dot ${ev.dot}`}
                      style={{
                        opacity: tlVisible ? 1 : 0,
                        transition: `opacity 0.3s ${EASE_OUT}`,
                        transitionDelay: `${getTlDotDelay(i)}ms`,
                      }}
                    />
                    {ev.connector && (
                      <div
                        className="lp-conn"
                        style={{
                          transform: tlVisible ? 'scaleY(1)' : 'scaleY(0)',
                          transition: `transform 0.4s ${EASE_SETTLE}`,
                          transitionDelay: `${getTlConnDelay(i)}ms`,
                        }}
                      />
                    )}
                  </div>
                  <div className="lp-ec">
                    <div
                      className={`lp-el${ev.warn ? ' wc' : ev.muted ? ' mc' : ''}`}
                      style={{
                        opacity: tlVisible ? 1 : 0,
                        transform: tlVisible ? 'translateX(0)' : 'translateX(-8px)',
                        transition: `opacity 0.35s ${EASE_OUT}, transform 0.35s ${EASE_OUT}`,
                        transitionDelay: `${getTlLabelDelay(i)}ms`,
                      }}
                    >{ev.label}</div>
                    <div className={`lp-es${ev.warn ? ' wc' : ''}`}>{ev.sub}</div>
                    {ev.chip && <div className="lp-chip">{ev.chip}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-mock lp-rv d2" role="img" aria-label="KOLOR quote builder showing a fine art commission with discount">
            <div className="lp-mhd">
              <div className="lp-mcl">
                <div className="lp-mav" aria-hidden="true">QB</div>
                <div>
                  <div className="lp-mn">New Offer</div>
                  <div className="lp-mm">Portrait Commission &middot; Draft</div>
                </div>
              </div>
              <div className="lp-mb">Draft</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: '16px', borderBottom: '.5px solid var(--bg-ghost)', paddingBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--cream-muted)' }}>Description</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--cream-muted)' }}>Qty</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--cream-muted)' }}>Price</div>
                </div>
                {([
                  ['Oil portrait commission', '1', '\u20a6600,000'],
                  ['Reference photo session', '1', '\u20a650,000'],
                  ['Framing & delivery', '1', '\u20a675,000'],
                ] as const).map(([desc, qty, price]) => (
                  <div key={desc} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', padding: '6px 0', borderBottom: '.5px solid var(--bg-ghost)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--cream)', fontWeight: 400 }}>{desc}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--cream-muted)', textAlign: 'center' }}>{qty}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--cream)', textAlign: 'right' }}>{price}</div>
                  </div>
                ))}
              </div>
              {([
                { label: 'Subtotal', amount: '\u20a6725,000', isDiscount: false, isTotal: false },
                { label: 'Discount 10%', amount: '\u2212\u20a672,500', isDiscount: true, isTotal: false },
                { label: 'Tax', amount: '\u20a60.00', isDiscount: false, isTotal: false },
                { label: 'Total', amount: '\u20a6652,500', isDiscount: false, isTotal: true },
              ]).map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: row.isTotal ? '10px 0 0' : '6px 0',
                  borderTop: row.isTotal ? '.5px solid var(--bg-faint)' : 'none',
                  marginTop: row.isTotal ? '4px' : '0',
                }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '.06em',
                    color: row.isTotal ? 'var(--cream)' : 'var(--cream-muted)',
                    fontWeight: row.isTotal ? 500 : 400,
                  }}>{row.label}</span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: row.isTotal ? '14px' : '11px',
                    color: row.isDiscount ? 'var(--green)' : row.isTotal ? 'var(--cream)' : 'var(--cream-muted)',
                    fontWeight: row.isTotal ? 700 : 400,
                    letterSpacing: '-.01em',
                  }}>{row.amount}</span>
                </div>
              ))}
              <div style={{ marginTop: '16px', borderTop: '.5px solid var(--bg-ghost)', paddingTop: '14px' }}>
                <div style={{
                  background: 'var(--brand)', borderRadius: '3px', padding: '10px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#fff', fontWeight: 500 }}>
                    Send Offer &rarr;
                  </span>
                </div>
              </div>
            </div>
          </div>

          </div>{/* end mock grid */}
        </div>
      </section>

      <section className="lp-ss" id="pricing" aria-labelledby="lp-price-h">
        <div className="lp-in lp-bt">
          <div className="lp-lbl lp-rv" aria-hidden="true">Pricing</div>
          <div className="lp-pg lp-rv d1">
            <div className="lp-pl">
              <div>
                <h2 className="lp-plh" id="lp-price-h">One payment.<br />Yours forever.</h2>
                <p className="lp-plb">
                  We&apos;re not building a subscription trap. Pay once. Use it
                  forever. When we open to the public, the price goes up and the
                  model changes. Ten founding studios get in before that happens.
                </p>
                <div className="lp-pills">
                  {['\ud83c\uddec\ud83c\udde7 United Kingdom', '\ud83c\uddf3\ud83c\uddec Nigeria', '\ud83c\uddff\ud83c\udde6 South Africa',
                    '\ud83c\udde7\ud83c\uddf7 Brazil', '\ud83c\udde9\ud83c\uddea Germany', '+ any currency'].map(p => (
                    <div key={p} className="lp-pill">{p}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lp-pr" ref={priceRef}>
              <div className="lp-fb">Founding member &mdash; first 10 studios</div>
              <div className="lp-pn">${priceCount}</div>
              <div className="lp-ps">One-time &middot; lifetime access at founding rate</div>
              <ul className="lp-feat">
                {[
                  'Unlimited clients and projects',
                  'Quotes, contracts, payments',
                  'Client portal with messaging and file delivery',
                  'Stripe and Paystack \u2014 any currency',
                  'Weekly pipeline digest',
                  'All future core features included',
                  'Priority support during beta',
                ].map(f => <li key={f}>{f}</li>)}
              </ul>
              <a
                href="/signup" className="lp-pcta"
                ref={btn3Ref}
                onMouseMove={e => magnetMove(e, btn3Ref)}
                onMouseLeave={() => magnetLeave(btn3Ref)}
              >Claim your studio &rarr;</a>

              {!notifySubmitted ? (
                <form
                  onSubmit={handleNotify}
                  style={{ marginTop: '20px', borderTop: '.5px solid var(--bg-ghost)', paddingTop: '20px' }}
                >
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--cream-muted)', marginBottom: '10px' }}>
                    Not ready yet? Get notified when we launch publicly.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={e => setNotifyEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      style={{
                        flex: 1, background: 'var(--ink)', border: '.5px solid var(--bg-mid)',
                        borderRadius: '3px', padding: '10px 14px',
                        fontFamily: "'DM Mono', monospace", fontSize: '11px',
                        color: 'var(--cream)', outline: 'none', letterSpacing: '.04em',
                      }}
                      data-testid="waitlist-email-input"
                    />
                    <button
                      type="submit"
                      disabled={notifyLoading}
                      style={{
                        background: 'transparent', border: '.5px solid var(--bg-mid)',
                        borderRadius: '3px', padding: '10px 16px',
                        fontFamily: "'DM Mono', monospace", fontSize: '10px',
                        letterSpacing: '.1em', textTransform: 'uppercase',
                        color: 'var(--cream-muted)', cursor: 'pointer',
                        transition: 'border-color .2s, color .2s', whiteSpace: 'nowrap',
                      }}
                      data-testid="waitlist-submit-btn"
                    >
                      {notifyLoading ? 'Saving...' : 'Notify me'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ marginTop: '20px', borderTop: '.5px solid var(--bg-ghost)', paddingTop: '20px', fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '.08em', color: 'var(--brand-light)' }} data-testid="waitlist-success">
                  You&apos;re on the list. We&apos;ll let you know when we launch publicly.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-ss" aria-labelledby="lp-global-h">
        <div className="lp-gi lp-bt" style={{ padding: '0 48px 120px' }}>
          <div className="lp-rv" style={{ paddingTop: '72px' }}>
            <div className="lp-lbl" aria-hidden="true">International by design</div>
            <h2 className="lp-sh2" id="lp-global-h" style={{ fontSize: 'clamp(28px,3.5vw,48px)', marginBottom: '18px' }}>
              Built where most<br />CRMs don&apos;t go.
            </h2>
            <p className="lp-plb" style={{ marginBottom: 0 }}>
              Most CRMs default to USD, US legal templates, and US-centric support hours.
              KOLOR was built for markets those tools don&apos;t serve. GDPR-native.
              Multi-currency. Dual payment processors.
            </p>
          </div>
          <div className="lp-rows lp-rv d1" style={{ marginTop: '72px' }}>
            {[
              ['\ud83c\uddee\ud83c\uddea Nigeria', 'NGN \u00b7 Paystack'],
              ['\ud83c\uddec\ud83c\udde7 United Kingdom', 'GBP \u00b7 GDPR'],
              ['\ud83c\uddff\ud83c\udde6 South Africa', 'ZAR \u00b7 Paystack'],
              ['\ud83c\udde9\ud83c\uddea Germany', 'EUR \u00b7 GDPR'],
              ['\ud83c\udde7\ud83c\uddf7 Brazil', 'BRL \u00b7 Stripe'],
              ['\ud83c\uddf0\ud83c\uddea Kenya', 'KES \u00b7 Paystack'],
              ['+ any market', 'Any currency \u00b7 Stripe global'],
            ].map(([m, d]) => (
              <div key={m} className="lp-row">
                <span className="lp-mkt">{m}</span>
                <span className="lp-det">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-ss" aria-labelledby="lp-close-h">
        <div className="lp-in">
          <div className="lp-ci lp-rv">
            <h2 className="lp-ch" id="lp-close-h">
              Stop losing work<br />to broken admin.
            </h2>
            <ul className="lp-clist" aria-label="What you deserve">
              <li>Your next commission <strong>deserves a contract.</strong></li>
              <li>Your next client <strong>deserves a portal.</strong></li>
              <li>You <strong>deserve to get paid.</strong></li>
            </ul>
            <a
              href="/signup" className="lp-cbtn"
              ref={btn4Ref}
              onMouseMove={e => magnetMove(e, btn4Ref)}
              onMouseLeave={() => magnetLeave(btn4Ref)}
            >Claim your studio &rarr;</a>
            <p className="lp-cnote">$97 one-time &middot; founding member rate &middot; closes at 10</p>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-flt">&copy; 2026 KOLOR Studio &middot; kolorstudio.app</div>
        <div className="lp-fr">
          <a href="https://x.com/kolor_studio" className="lp-fl" target="_blank" rel="noopener noreferrer">@kolor_studio</a>
          <a href="mailto:hello@kolorstudio.app" className="lp-fl">Contact</a>
          <a href="/privacy" className="lp-fl">Privacy</a>
        </div>
      </footer>
    </div>
  )
}
