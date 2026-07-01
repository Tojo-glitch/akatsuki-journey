import React, { useState, useEffect } from 'react'
import { getConfig } from './lib/api'
import { usePIN } from './hooks/usePIN'
import { useToast } from './hooks/useToast'
import { PINModal, ToastList } from './components/UI'
import Dashboard from './pages/Dashboard'
import AddTrade from './pages/AddTrade'
import History from './pages/History'
import Calendar from './pages/Calendar'
import Public from './pages/Public'
import Settings from './pages/Settings'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'add',       label: 'Add Trade', icon: '✚' },
  { id: 'history',   label: 'History',   icon: '≡' },
  { id: 'calendar',  label: 'Calendar',  icon: '◫' },
  { id: 'public',    label: 'Public',    icon: '◎' },
  { id: 'settings',  label: 'Settings',  icon: '⚙' },
]

export default function App() {
  const [page, setPage]     = useState('dashboard')
  const [config, setConfig] = useState({
    pairs: ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'],
    setupTypes: ['BOS', 'OB', 'FVG', 'Other'],
    behaviorTags: ['Planned', 'Revenge Trade', 'FOMO', 'Disciplined'],
  })
  const [editData,  setEditData]  = useState(null)
  const { pinModal, requirePin, onPinConfirmed, closeModal } = usePIN()
  const { toasts, toast } = useToast()

  useEffect(() => {
    getConfig().then(setConfig).catch(() => {})
  }, [])

  // When edit is requested from History, switch to Add page
  const handleEdit = (trade) => {
    setEditData(trade)
    setPage('add')
  }
  const handleEditDone = () => {
    setEditData(null)
    setPage('history')
  }

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

  const nav = (id) => {
    if (id !== 'add') setEditData(null)
    setPage(id)
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar (desktop / tablet landscape) ── */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">TJ</div>
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
          <label>Quick Pair</label>
          <select
            style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 9px', fontSize: 13, fontFamily: 'var(--mono)', width: '100%', cursor: 'pointer' }}
            defaultValue={config.pairs[0]}
            onChange={e => {
              // Jump to Add Trade with this pair pre-selected
              setEditData(null)
              setPage('add')
            }}>
            {config.pairs.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-area">
        {renderPage()}
      </main>

      {/* ── Bottom nav (mobile / tablet portrait) ── */}
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