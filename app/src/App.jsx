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
import Settings  from './pages/Settings'

// เนวิเกชั่นเมนูแบบมาตรฐานสากล ไร้อีโมจิและคำย่อแปลกปลอมรบกวนสายตา
const PAGES = [
  { id: 'dashboard', label: 'Dashboard',   public: true  },
  { id: 'history',   label: 'Trade Ledger', public: true  },
  { id: 'add',       label: 'Log Trade',   public: false },
  { id: 'settings',  label: 'Settings',    public: false },
]

function WordmarkLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 20px' }}>
      <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="24" fill="var(--green)" />
        <path d="M26 72 L42 28 L58 72 M31 58 H53" stroke="#0C1017" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M66 28 V72 M66 50 L81 28 M66 50 L81 72" stroke="#0C1017" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)' }}>
        Trade<span style={{ color: 'var(--green)' }}>Log</span>
      </div>
    </div>
  )
}

function getInitialTheme() {
  return localStorage.getItem('tj_theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('tj_theme', t)
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [config, setConfig] = useState({
    pairs:        ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'],
    setupTypes:   ['BOS', 'OB', 'FVG', 'Liquidity Sweep', 'MSS', 'Other'],
    behaviorTags: ['Planned', 'Revenge Trade', 'FOMO', 'Disciplined'],
  })
  const [editData, setEditData] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)

  const { isOwner, unlock, lock } = useAuth()
  const { pinModal, requirePin, onPinConfirmed, closeModal } = usePIN(unlock)
  const { toasts, toast } = useToast()
  const { installPrompt, isInstalled, updateAvailable, triggerInstall, applyUpdate } = usePWA()

  useEffect(() => { applyTheme(theme) }, [theme])
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  useEffect(() => { getConfig().then(setConfig).catch(() => {}) }, [])
  useEffect(() => { trackPageView(page) }, [page])

  const handleEdit = useCallback((t) => { setEditData(t); setPage('add') }, [])
  const handleEditDone = useCallback(() => { setEditData(null); setPage('history') }, [])
  
  const nav = useCallback((id) => {
    if (id !== 'add') setEditData(null)
    setPage(id)
  }, [])
  
  const handleUnlockRequest = useCallback(() => { requirePin(() => {}) }, [requirePin])

  // โยนฟังก์ชัน setPage ไปให้ Dashboard ด้วยเพื่อใช้ในระบบ Onboarding CTA
  const sharedProps = { config, setConfig, requirePin, toast, isOwner, setPage }

  const renderPage = () => {
    if (isProtectedPage(page) && !isOwner)
      return <LockedPage page={page} onUnlock={handleUnlockRequest} />
    switch (page) {
      case 'dashboard': return <Dashboard {...sharedProps} />
      case 'add':       return <AddTrade  {...sharedProps} editData={editData} onEditDone={handleEditDone} />
      case 'history':   return <History   {...sharedProps} onEdit={handleEdit} />
      case 'settings':  return <Settings  {...sharedProps} onLock={lock} />
      default: return null
    }
  }

  return (
    <div className="app-shell">
      <NetworkBanner />

      {updateAvailable && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9997,
          background: 'var(--blue)', color: '#fff', padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 13 }}>
          <span>System update pending</span>
          <button onClick={applyUpdate} style={{ background: 'rgba(255,255,255,.2)',
            border: 'none', borderRadius: 4, padding: '4px 12px', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
            RELOAD
          </button>
        </div>
      )}

      {/* ── Sidebar (desktop) ── */}
      <aside className="sidebar">
        <WordmarkLogo />

        <nav className="nav-section">
          {PAGES.map(p => (
            <button key={p.id}
              className={`nav-item ${page === p.id ? 'active' : ''} ${!p.public && !isOwner ? 'nav-locked' : ''}`}
              onClick={() => nav(p.id)}
              style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
              {p.label}
              {!p.public && !isOwner && <span style={{ marginLeft: 'auto', fontSize: 9, opacity: .4 }}>[SECURE]</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer-area">
          {isOwner ? (
            <button onClick={lock} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(38,217,160,.06)', border: '1px solid rgba(38,217,160,.15)',
              borderRadius: 4, padding: '8px 10px', cursor: 'pointer', color: 'var(--green)',
              fontSize: 11, fontWeight: 700, width: '100%', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Lock Session
            </button>
          ) : (
            <button onClick={handleUnlockRequest} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 4, padding: '8px 10px', cursor: 'pointer', color: 'var(--t2)',
              fontSize: 11, width: '100%', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Unlock Owner Mode
            </button>
          )}

          <button onClick={toggleTheme} style={{ background: 'var(--card2)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '8px 10px', cursor: 'pointer', color: 'var(--t2)',
            fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
          </button>

          {installPrompt && !isInstalled && (
            <button onClick={triggerInstall} style={{ background: 'rgba(91,159,255,.08)',
              border: '1px solid rgba(91,159,255,.2)', borderRadius: 4, padding: '8px 10px',
              cursor: 'pointer', color: 'var(--blue)', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Install App
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

      {/* ── Bottom nav (mobile) แก้ปัญหาการแสดงผลชื่อเมนูจริง ── */}
      <nav className="bottom-nav">
        {PAGES.map(p => (
          <button key={p.id} className={`bnav-btn ${page === p.id ? 'active' : ''}`} onClick={() => nav(p.id)}>
            <span style={{ fontSize: 11, fontWeight: 800 }}>{p.label.toUpperCase()}</span>
          </button>
        ))}
      </nav>

      <button className="theme-fab" onClick={toggleTheme} title="Toggle theme" style={{ borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
        {theme === 'dark' ? 'LIGHT' : 'DARK'}
      </button>

      <PINModal open={pinModal} onConfirm={onPinConfirmed} onClose={closeModal} />
      <ToastList toasts={toasts} />
    </div>
  )
}