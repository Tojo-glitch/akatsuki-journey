import React, { useState, useEffect, useCallback } from 'react'
import { getConfig, trackPageView } from './lib/api'
import { usePIN }  from './hooks/usePIN'
import { useAuth, isProtectedPage } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import { PINModal, ToastList } from './components/UI'
import { ErrorBoundary, NetworkBanner } from './components/ErrorBoundary'
import LockedPage from './components/LockedPage'
import Dashboard from './pages/Dashboard'
import AddTrade  from './pages/AddTrade'
import History   from './pages/History'
import Calendar  from './pages/Calendar'
import Public    from './pages/Public'
import Settings  from './pages/Settings'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦', public: true  },
  { id: 'add',       label: 'Add Trade', icon: '✚', public: false },
  { id: 'history',   label: 'History',   icon: '≡', public: true  },
  { id: 'calendar',  label: 'Calendar',  icon: '◫', public: true  },
  { id: 'public',    label: 'Public',    icon: '◎', public: true  },
  { id: 'settings',  label: 'Settings',  icon: '⚙', public: false },
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

// ── SVG Logo ─────────────────────────────────────────────────────
function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-label="TradeLog">
      <rect width="28" height="28" rx="8" fill="url(#lgGrad)"/>
      <defs>
        <linearGradient id="lgGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
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
  // ใช้ค่าเริ่มต้นที่มีอาเรย์รองรับไว้เสมอ ป้องกันอาการหมุนโหลดเสี้ยววินาทีแรกแล้ว undefined
  const [config, setConfig] = useState({ 
    pairs: [], 
    setupTypes: [], 
    behaviorTags: [] 
  })
  const [editData, setEditData] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)

  const { isOwner, unlock, lock } = useAuth()
  const { pinModal, requirePin, onPinConfirmed, closeModal } = usePIN(unlock)
  const { toasts, toast } = useToast()

  // Apply theme on mount and change
  useEffect(() => { applyTheme(theme) }, [theme])
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // Load config
  useEffect(() => {
    getConfig().then(setConfig).catch(() => {})
  }, [])

  // Track page views (Phase 3 — visitor analytics)
  useEffect(() => {
    trackPageView(page)
  }, [page])

  const handleEdit     = (trade) => { setEditData(trade); setPage('add') }
  const handleEditDone = ()      => { setEditData(null);  setPage('history') }

  const nav = useCallback((id) => {
    if (id !== 'add') setEditData(null)
    setPage(id)
  }, [])

  // When locked page requests unlock
  const handleUnlockRequest = useCallback(() => {
    requirePin(() => {}) // just unlock the session, page re-renders via isOwner
  }, [requirePin])

  const sharedProps = { config, setConfig, requirePin, toast, isOwner }

  // ── Route Guard ────────────────────────────────────────────────
  const renderPage = () => {
    // Protected pages — show lock screen if not owner
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
        <div className="logo">
          <LogoMark />
          <div className="logo-name">TradeLog</div>
        </div>

        <nav className="nav-section">
          {PAGES.map(p => (
            <button key={p.id}
              className={`nav-item ${page === p.id ? 'active' : ''} ${!p.public && !isOwner ? 'nav-locked' : ''}`}
              onClick={() => nav(p.id)}>
              <span className="nav-icon">{p.icon}</span>
              {p.label}
              {!p.public && !isOwner && (
                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: .5 }}>🔐</span>
              )}
            </button>
          ))}
        </nav>

        {/* Owner toggle + Theme + Quick pair */}
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
              {config.pairs.map(p => <option key={p}>{p}</option>)}
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
            <span className="bnav-icon">
              {!p.public && !isOwner ? '🔐' : p.icon}
            </span>
            <span>{p.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Theme toggle on mobile (FAB) ── */}
      <button
        className="theme-fab"
        onClick={toggleTheme}
        title="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* ── Modals ── */}
      <PINModal open={pinModal} onConfirm={onPinConfirmed} onClose={closeModal} />
      <ToastList toasts={toasts} />
    </div>
  )
}