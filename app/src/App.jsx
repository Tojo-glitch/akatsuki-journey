import React, { useState, useEffect, useCallback } from 'react'
import { getConfig, trackPageView } from './lib/api'
import { usePIN }  from './hooks/usePIN'
import { useAuth, isProtectedPage } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import { PINModal, ToastList } from './components/UI'
import { ErrorBoundary, NetworkBanner } from './components/ErrorBoundary'
import LockedPage from './components/LockedPage'
import Dashboard from './pages/Dashboard'
import AddTrade   from './pages/AddTrade'
import History    from './pages/History'
import Calendar  from './pages/Calendar'
import Public    from './pages/Public'
import Settings  from './pages/Settings'

// ── ⚙️ ปรับเปลี่ยนไอคอนเมนูตรงนี้ตามต้องการ ───────────────────────────
const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦', public: true  },
  { id: 'add',       label: 'Add Trade', icon: '+', public: false }, // เปลี่ยนเป็น + 
  { id: 'history',   label: 'History',   icon: '≡', public: true  },
  { id: 'calendar',  label: 'Calendar',  icon: '◫', public: true  },
  { id: 'public',    label: 'Public',    icon: '◎', public: true  },
  { id: 'settings',  label: 'Settings',  icon: '⚙', public: false }, // เปลี่ยนเป็น ⚙
]

// ── Theme ────────────────────────────────────────────────────────
function getInitialTheme() {
  return localStorage.getItem('tj_theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('tj_theme', theme)
}

// ── 📐 ปรับเปลี่ยนดีไซน์โลโก้จาก "รูปโลก" เป็นสไตล์พิมพ์พิมล "aka Blueprint" ──────────────────
function LogoMark() {
  return (
    <div style={{
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      background: 'var(--card2)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace, sans-serif',
      fontSize: '15px',
      fontWeight: '800',
      color: 'var(--green)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      userSelect: 'none'
    }}>
      a.
    </div>
  )
}

// ── Theme toggle button ───────────────────────────────────────────
function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        background: 'var(--card2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
        color: 'var(--t2)', fontSize: 16, display: 'flex',
        alignItems: 'center', gap: 6, width: '100%',
        transition: 'all .12s',
      }}>
      <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
      <span style={{ fontSize: 12, fontWeight: 500 }}>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  )
}

// ── Owner badge in sidebar ────────────────────────────────────────
function OwnerBadge({ isOwner, onLock, onUnlock }) {
  if (isOwner) {
    return (
      <button onClick={onLock} style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'rgba(38,217,160,.08)', border: '1px solid rgba(38,217,160,.2)',
        borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
        color: 'var(--green)', fontSize: 12, fontWeight: 600, width: '100%',
        marginBottom: 6,
      }}>
        <span>🔓</span> Owner Mode — Lock
      </button>
    )
  }
  return (
    <button onClick={onUnlock} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: 'transparent', border: '1px solid var(--border)',
      borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
      color: 'var(--t2)', fontSize: 12, fontWeight: 500, width: '100%',
      marginBottom: 6,
    }}>
      <span>🔐</span> Enter Owner Mode
    </button>
  )
}

export default function App() {
  const [page,   setPage]   = useState('dashboard')
  
  const [config, setConfig] = useState({ 
    pairs: ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'], 
    setupTypes: ['BOS', 'OB', 'FVG', 'Liquidity Sweep', 'MSS', 'Other'], 
    behaviorTags: ['Planned', 'Revenge Trade', 'FOMO', 'Disciplined'] 
  })
  
  const [editData, setEditData] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)

  const { isOwner, unlock, lock } = useAuth()
  const { pinModal, requirePin, onPinConfirmed, closeModal } = usePIN(unlock)
  const { toasts, toast } = useToast()

  useEffect(() => { applyTheme(theme) }, [theme])
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    getConfig()
      .then(res => {
        if (res) setConfig(res)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    trackPageView(page)
  }, [page])

  const handleEdit     = (trade) => { setEditData(trade); setPage('add') }
  const handleEditDone = ()      => { setEditData(null);  setPage('history') }

  const nav = useCallback((id) => {
    if (id !== 'add') setEditData(null)
    setPage(id)
  }, [])

  const handleUnlockRequest = useCallback(() => {
    requirePin(() => {})
  }, [requirePin])

  const safeConfig = {
    pairs: config?.pairs || [],
    setupTypes: config?.setupTypes || [],
    behaviorTags: config?.behaviorTags || []
  }

  const sharedProps = { config: safeConfig, setConfig, requirePin, toast, isOwner }

  const renderPage = () => {
    if (isProtectedPage(page) && !isOwner) {
      return <LockedPage page={page} onUnlock={handleUnlockRequest} />
    }

    switch (page) {
      case 'dashboard': return <Dashboard {...sharedProps} />
      case 'add':       return <AddTrade  {...sharedProps} editData={editData} onEditDone={handleEditDone} />
      case 'history':   return <History   {...sharedProps} onEdit={handleEdit} />
      case 'calendar':  return <Calendar  {...sharedProps} />
      case 'public':    return <Public    {...sharedProps} />
      case 'settings':  return <Settings  {...sharedProps} />
      default:          return null
    }
  }

  return (
    <div className="app-shell">
      <NetworkBanner />

      {/* ── Sidebar (desktop + tablet landscape) ── */}
      <aside className="sidebar">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <LogoMark />
          <div className="logo-name" style={{ 
            fontSize: '22px', 
            fontWeight: '700', 
            letterSpacing: '-0.05em', 
            fontFamily: 'monospace, sans-serif', 
            color: 'var(--t1)',
            textTransform: 'lowercase'
          }}>
            aka
          </div>
        </div>

        <nav className="nav-section">
          {PAGES.map(p => (
            <button key={p.id}
              className={`nav-item ${page === p.id ? 'active' : ''} ${!p.public && !isOwner ? 'nav-locked' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              onClick={() => nav(p.id)}>
              <span className="nav-icon" style={{ fontSize: p.icon === '+' ? '18px' : '16px', fontWeight: p.icon === '+' ? '600' : 'normal' }}>
                {p.icon}
              </span>
              {p.label}
              {!p.public && !isOwner && (
                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: .5 }}>🔐</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer-area">
          <OwnerBadge
            isOwner={isOwner}
            onLock={lock}
            onUnlock={handleUnlockRequest}
          />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <div style={{ marginTop: 8 }}>
            <div className="pair-sel-label">Quick Pair</div>
            <select className="pair-select" onChange={() => { setEditData(null); nav('add') }}>
              {safeConfig.pairs.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-area">
        <ErrorBoundary key={page}>
          {renderPage()}
        </ErrorBoundary>
      </main>

      {/* ── Bottom nav (mobile + tablet portrait) ── */}
      <nav className="bottom-nav">
        {PAGES.map(p => (
          <button key={p.id}
            className={`bnav-btn ${page === p.id ? 'active' : ''}`}
            onClick={() => nav(p.id)}>
            <span className="bnav-icon" style={{ fontSize: p.icon === '+' ? '20px' : '16px' }}>
              {!p.public && !isOwner ? '🔐' : p.icon}
            </span>
            <span>{p.id === 'dashboard' ? 'aka' : p.label}</span>
          </button>
        ))}
      </nav>

      <button
        className="theme-fab"
        onClick={toggleTheme}
        title="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <PINModal open={pinModal} onConfirm={onPinConfirmed} onClose={closeModal} />
      <ToastList toasts={toasts} />
    </div>
  )
}