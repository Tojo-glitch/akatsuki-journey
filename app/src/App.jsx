import React, { useState, useEffect } from 'react'
import { getConfig } from './lib/api'
import { usePIN } from './hooks/usePIN'
import { useToast } from './hooks/useToast'
import { PINModal, ToastList } from './components/UI'
import { ErrorBoundary, NetworkBanner } from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import AddTrade  from './pages/AddTrade'
import History   from './pages/History'
import Calendar  from './pages/Calendar'
import Public    from './pages/Public'
import Settings  from './pages/Settings'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'add',       label: 'Add Trade', icon: '✚' },
  { id: 'history',   label: 'History',   icon: '≡' },
  { id: 'calendar',  label: 'Calendar',  icon: '◫' },
  { id: 'public',    label: 'Public',    icon: '◎' },
  { id: 'settings',  label: 'Settings',  icon: '⚙' },
]

// ── Logo SVG ─────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="url(#lg)"/>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#26D9A0"/>
          <stop offset="100%" stopColor="#1AB87F"/>
        </linearGradient>
      </defs>
      {/* Chart bars + arrow up = "trade going up" */}
      <rect x="5"  y="16" width="4" height="7" rx="1" fill="#082018"/>
      <rect x="12" y="12" width="4" height="11" rx="1" fill="#082018"/>
      <rect x="19" y="8"  width="4" height="15" rx="1" fill="#082018"/>
      <path d="M7 10 L14 6 L21 9" stroke="#082018" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7"  cy="10" r="1.5" fill="#082018"/>
      <circle cx="14" cy="6"  r="1.5" fill="#082018"/>
      <circle cx="21" cy="9"  r="1.5" fill="#082018"/>
    </svg>
  )
}

export default function App() {
  const [page,     setPage]     = useState('dashboard')
  const [config,   setConfig]   = useState({
    pairs:        ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'],
    setupTypes:   ['BOS', 'OB', 'FVG', 'Liquidity Sweep', 'MSS', 'Other'],
    behaviorTags: ['Planned', 'Revenge Trade', 'FOMO', 'Disciplined'],
  })
  const [editData, setEditData] = useState(null)
  const [configLoaded, setConfigLoaded] = useState(false)

  const { pinModal, requirePin, onPinConfirmed, closeModal } = usePIN()
  const { toasts, toast } = useToast()

  useEffect(() => {
    getConfig()
      .then(cfg => { setConfig(cfg); setConfigLoaded(true) })
      .catch(() => setConfigLoaded(true)) // use defaults on error
  }, [])

  const handleEdit = (trade) => { setEditData(trade); setPage('add') }
  const handleEditDone = () => { setEditData(null); setPage('history') }
  const nav = (id) => { if (id !== 'add') setEditData(null); setPage(id) }

  const sharedProps = { config, setConfig, requirePin, toast }

  const renderPage = () => {
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
              className={`nav-item ${page === p.id ? 'active' : ''}`}
              onClick={() => nav(p.id)}>
              <span className="nav-icon">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-pair">
          <label>Quick Pair Filter</label>
          <select
            style={{
              background: 'var(--bg)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 6,
              padding: '7px 9px', fontSize: 13, fontFamily: 'var(--mono)',
              width: '100%', cursor: 'pointer',
            }}
            onChange={e => {
              // Store selected pair context and jump to Add Trade
              setEditData(null)
              setPage('add')
            }}>
            {config.pairs.map(p => <option key={p}>{p}</option>)}
          </select>
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
            <span className="bnav-icon">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </nav>

      {/* ── Modals ── */}
      <PINModal open={pinModal} onConfirm={onPinConfirmed} onClose={closeModal} />
      <ToastList toasts={toasts} />
    </div>
  )
}