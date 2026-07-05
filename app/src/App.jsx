import React, { useState, useEffect, useCallback } from 'react'
import { getConfig, trackPageView } from './lib/api'
import { usePIN }  from './hooks/usePIN'
import { useAuth, isProtectedPage } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import { usePWA }  from './hooks/usePWA'
import { PINModal, ToastList } from './components/UI'
import { ErrorBoundary, NetworkBanner } from './components/ErrorBoundary'
import LockedPage from './components/LockedPage'
import Dashboard from './pages/Dashboard'
import AddTrade  from './pages/AddTrade'
import History   from './pages/History'
import Calendar  from './pages/Calendar'
import Analysis  from './pages/Analysis'
import Public    from './pages/Public'
import Settings  from './pages/Settings'

const PAGES = [
  { id:'dashboard', label:'Dashboard', icon:'▦', public:true  },
  { id:'add',       label:'Add Trade', icon:'✚', public:false },
  { id:'history',   label:'History',   icon:'≡', public:true  },
  { id:'calendar',  label:'Calendar',  icon:'◫', public:true  },
  { id:'analysis',  label:'Analysis',  icon:'◉', public:true  },
  { id:'public',    label:'Public',    icon:'◎', public:true  },
  { id:'settings',  label:'Settings',  icon:'⚙', public:false },
]

// ── Theme ─────────────────────────────────────────────────────────
function getInitialTheme() {
  return localStorage.getItem('tj_theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('tj_theme', t)
}

// ── SVG Logo ──────────────────────────────────────────────────────
function LogoMark({ size=28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="url(#lgG)"/>
      <defs>
        <linearGradient id="lgG" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#26D9A0"/>
          <stop offset="100%" stopColor="#1AB87F"/>
        </linearGradient>
      </defs>
      <rect x="5"  y="17" width="4" height="6"  rx="1" fill="#082018" opacity=".9"/>
      <rect x="12" y="13" width="4" height="10" rx="1" fill="#082018" opacity=".9"/>
      <rect x="19" y="9"  width="4" height="14" rx="1" fill="#082018" opacity=".9"/>
      <polyline points="7,11 14,7 21,10" stroke="#082018" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".9"/>
      <circle cx="7"  cy="11" r="1.5" fill="#082018" opacity=".9"/>
      <circle cx="14" cy="7"  r="1.5" fill="#082018" opacity=".9"/>
      <circle cx="21" cy="10" r="1.5" fill="#082018" opacity=".9"/>
    </svg>
  )
}

export default function App() {
  const [page,   setPage]   = useState('dashboard')
  const [config, setConfig] = useState({
    pairs:        ['XAUUSD','EURUSD','GBPUSD','USDJPY','BTCUSD'],
    setupTypes:   ['BOS','OB','FVG','Liquidity Sweep','MSS','Other'],
    behaviorTags: ['Planned','Revenge Trade','FOMO','Disciplined'],
  })
  const [editData, setEditData] = useState(null)
  const [theme,    setTheme]    = useState(getInitialTheme)

  const { isOwner, unlock, lock } = useAuth()
  const { pinModal, requirePin, onPinConfirmed, closeModal } = usePIN(unlock)
  const { toasts, toast } = useToast()
  const { installPrompt, isInstalled, updateAvailable, triggerInstall, applyUpdate } = usePWA()

  useEffect(() => { applyTheme(theme) }, [theme])
  const toggleTheme = () => setTheme(t => t==='dark'?'light':'dark')

  useEffect(() => { getConfig().then(setConfig).catch(()=>{}) }, [])
  useEffect(() => { trackPageView(page) }, [page])

  const handleEdit     = useCallback((t) => { setEditData(t); setPage('add')     }, [])
  const handleEditDone = useCallback(()  => { setEditData(null); setPage('history') }, [])
  const nav = useCallback((id) => {
    if (id !== 'add') setEditData(null)
    setPage(id)
  }, [])
  const handleUnlockRequest = useCallback(() => { requirePin(()=>{}) }, [requirePin])

  const sharedProps = { config, setConfig, requirePin, toast, isOwner }

  const renderPage = () => {
    if (isProtectedPage(page) && !isOwner)
      return <LockedPage page={page} onUnlock={handleUnlockRequest} />
    switch(page) {
      case 'dashboard': return <Dashboard {...sharedProps} />
      case 'add':       return <AddTrade  {...sharedProps} editData={editData} onEditDone={handleEditDone} />
      case 'history':   return <History   {...sharedProps} onEdit={handleEdit} />
      case 'calendar':  return <Calendar  {...sharedProps} onEdit={handleEdit} />
      case 'analysis':  return <Analysis  toast={toast} />
      case 'public':    return <Public    {...sharedProps} />
      case 'settings':  return <Settings  {...sharedProps} />
      default: return null
    }
  }

  return (
    <div className="app-shell">
      <NetworkBanner />

      {/* PWA update banner */}
      {updateAvailable && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9997,
          background:'var(--blue)', color:'#fff', padding:'8px 16px',
          display:'flex', alignItems:'center', justifyContent:'center', gap:12, fontSize:13 }}>
          <span>🔄 Update available</span>
          <button onClick={applyUpdate} style={{ background:'rgba(255,255,255,.2)',
            border:'none', borderRadius:6, padding:'4px 12px', color:'#fff', cursor:'pointer', fontSize:12 }}>
            Reload
          </button>
        </div>
      )}

      {/* ── Sidebar (desktop) ── */}
      <aside className="sidebar">
        <div className="logo">
          <LogoMark />
          <div className="logo-name">TradeLog</div>
        </div>

        <nav className="nav-section">
          {PAGES.map(p => (
            <button key={p.id}
              className={`nav-item ${page===p.id?'active':''} ${!p.public&&!isOwner?'nav-locked':''}`}
              onClick={()=>nav(p.id)}>
              <span className="nav-icon">{p.icon}</span>
              {p.label}
              {!p.public && !isOwner && <span style={{ marginLeft:'auto', fontSize:10, opacity:.4 }}>🔐</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer-area">
          {/* Owner toggle */}
          {isOwner ? (
            <button onClick={lock} style={{ display:'flex', alignItems:'center', gap:7,
              background:'rgba(38,217,160,.08)', border:'1px solid rgba(38,217,160,.2)',
              borderRadius:8, padding:'7px 10px', cursor:'pointer', color:'var(--green)',
              fontSize:12, fontWeight:600, width:'100%' }}>
              <span>🔓</span> Owner Mode — Lock
            </button>
          ) : (
            <button onClick={handleUnlockRequest} style={{ display:'flex', alignItems:'center', gap:7,
              background:'transparent', border:'1px solid var(--border)',
              borderRadius:8, padding:'7px 10px', cursor:'pointer', color:'var(--t2)',
              fontSize:12, width:'100%' }}>
              <span>🔐</span> Enter Owner Mode
            </button>
          )}

          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{ background:'var(--card2)', border:'1px solid var(--border)',
            borderRadius:8, padding:'7px 10px', cursor:'pointer', color:'var(--t2)',
            fontSize:12, display:'flex', alignItems:'center', gap:6, width:'100%' }}>
            {theme==='dark'?'☀️ Light Mode':'🌙 Dark Mode'}
          </button>

          {/* PWA install */}
          {installPrompt && !isInstalled && (
            <button onClick={triggerInstall} style={{ background:'rgba(91,159,255,.1)',
              border:'1px solid rgba(91,159,255,.25)', borderRadius:8, padding:'7px 10px',
              cursor:'pointer', color:'var(--blue)', fontSize:12,
              display:'flex', alignItems:'center', gap:6, width:'100%' }}>
              📱 Install App
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-area">
        <ErrorBoundary key={page}>
          {renderPage()}
        </ErrorBoundary>
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="bottom-nav">
        {PAGES.map(p => (
          <button key={p.id} className={`bnav-btn ${page===p.id?'active':''}`} onClick={()=>nav(p.id)}>
            <span className="bnav-icon">{!p.public&&!isOwner?'🔐':p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Theme FAB (mobile) ── */}
      <button className="theme-fab" onClick={toggleTheme} title="Toggle theme">
        {theme==='dark'?'☀️':'🌙'}
      </button>

      <PINModal open={pinModal} onConfirm={onPinConfirmed} onClose={closeModal} />
      <ToastList toasts={toasts} />
    </div>
  )
}