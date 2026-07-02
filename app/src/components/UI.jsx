import React, { useRef, useEffect, useState, createContext, useContext } from 'react'

// ── Badge ────────────────────────────────────────────────────────
export function Badge({ type, children }) {
  const cls = {
    win: 'badge-win', loss: 'badge-loss', miss: 'badge-miss',
    Win: 'badge-win', Loss: 'badge-loss', Miss: 'badge-miss',
    buy: 'badge-buy', sell: 'badge-sell',
    Buy: 'badge-buy', Sell: 'badge-sell',
    Asia: 'badge-asia', London: 'badge-london', 'New York': 'badge-ny',
  }[type] || 'badge-miss'
  return <span className={`badge ${cls}`}>{children ?? type}</span>
}

// ── Skeleton ─────────────────────────────────────────────────────
export function SkeletonStats() {
  return (
    <div className="stats-row" style={{ marginBottom: 16 }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton skel-stat" />)}
    </div>
  )
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="skeleton skel-line" style={{ marginBottom: 10, width: i % 3 === 0 ? '100%' : i % 3 === 1 ? '85%' : '70%' }} />
      ))}
    </div>
  )
}

export function SkeletonCard({ height = 200 }) {
  return <div className="skeleton" style={{ height, borderRadius: 10, marginBottom: 14 }} />
}

// ── Empty ────────────────────────────────────────────────────────
export function Empty({ icon = '◎', text = 'No data yet', sub }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <p>{text}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

// ── PIN Modal ────────────────────────────────────────────────────
// Fix: use useRef inside component properly (not inside map)
export function PINModal({ open, onConfirm, onClose }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

  const r0 = useRef(null), r1 = useRef(null), r2 = useRef(null)
  const r3 = useRef(null), r4 = useRef(null), r5 = useRef(null)
  const refs = [r0, r1, r2, r3, r4, r5]

  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '', '', ''])
      setError('')
      setLoading(false)
      setTimeout(() => refs[0].current?.focus(), 80)
    }
  }, [open])

  if (!open) return null

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const d = [...digits]; d[i] = ''; setDigits(d)
      } else {
        refs[i - 1]?.current?.focus()
      }
    }
    if (e.key === 'Enter') handleConfirm()
  }

  const handleInput = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const d = [...digits]; d[i] = val; setDigits(d)
    if (val && i < 5) refs[i + 1].current?.focus()
  }

  const handleConfirm = async () => {
    const pin = digits.join('')
    if (pin.length < 6) { setError('Enter all 6 digits'); return }
    setLoading(true)
    setError('')
    try {
      const ok = await onConfirm(pin)
      if (!ok) {
        setError('Incorrect PIN — try again')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => refs[0].current?.focus(), 50)
      }
    } catch (err) {
      setError(err.message || 'Connection error')
    }
    setLoading(false)
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ fontSize: 36, marginBottom: 6 }}>🔐</div>
        <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, marginBottom: 4 }}>Owner Access</h3>
        <p style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 16 }}>Enter your 6-digit PIN to continue</p>
        <div className="pin-dots">
          {digits.map((d, i) => (
            <input
              key={i} ref={refs[i]} className="pin-dot"
              type="password" inputMode="numeric"
              maxLength={1} value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
            />
          ))}
        </div>
        <div className="pin-error" style={{ minHeight: 18 }}>{error}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
            {loading ? '⏳ Checking…' : 'Confirm'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 14 }}>
          PIN is valid for 15 minutes per session
        </p>
      </div>
    </div>
  )
}

// ── Confirm dialog ────────────────────────────────────────────────
export function Confirm({ open, title, msg, onYes, onNo, danger = true }) {
  if (!open) return null
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onNo()}>
      <div className="modal" style={{ maxWidth: 340 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-ghost" onClick={onNo}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onYes}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ────────────────────────────────────────────────────────
export function ToastList({ toasts }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      maxWidth: 360, width: 'calc(100vw - 48px)',
    }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span style={{ fontSize: 15 }}>{t.type === 'success' ? '✓' : '✕'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ── Count-up ──────────────────────────────────────────────────────
export function CountUp({ value, suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const target = parseFloat(value) || 0
    const start = Date.now()
    const dur = 700
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(+(target * ease).toFixed(decimals))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, decimals])

  return <>{display}{suffix}</>
}

// ── Lightbox ──────────────────────────────────────────────────────
export function Lightbox({ src, onClose }) {
  useEffect(() => {
    if (!src) return
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [src, onClose])

  if (!src) return null
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <img src={src} alt="Trade chart"
        onClick={e => e.stopPropagation()}
        onError={e => { e.target.style.display = 'none' }}
      />
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(0,0,0,.5)', border: 'none', color: '#fff',
        width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
        fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>✕</button>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────
export function SectionHeader({ title, right }) {
  return (
    <div className="card-header">
      <span className="section-title">{title}</span>
      {right}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────
export function StatCard({ label, color, sub, children }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{children}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

// ── Validation helpers ────────────────────────────────────────────
export function validate(form) {
  const errors = {}

  if (!form.trade_date) errors.trade_date = 'Date is required'

  if (!form.entry_price && form.entry_price !== 0) {
    errors.entry_price = 'Entry price is required'
  } else if (isNaN(parseFloat(form.entry_price))) {
    errors.entry_price = 'Must be a number'
  }

  if (!form.stop_loss && form.stop_loss !== 0) {
    errors.stop_loss = 'Stop loss is required'
  } else if (isNaN(parseFloat(form.stop_loss))) {
    errors.stop_loss = 'Must be a number'
  }

  if (!form.result) errors.result = 'Select a result'

  // Sanity checks
  const e = parseFloat(form.entry_price)
  const sl = parseFloat(form.stop_loss)
  const tp = parseFloat(form.target_price)

  if (e && sl && e === sl) errors.stop_loss = 'Stop loss cannot equal entry price'

  if (e && sl && tp) {
    const dir = e > sl ? 'Buy' : 'Sell'
    const tpSide = dir === 'Buy' ? tp > e : tp < e
    if (!tpSide) errors.target_price = `Target should be ${dir === 'Buy' ? 'above' : 'below'} entry for a ${dir}`
  }

  return errors
}

// ── Helpers ───────────────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) }
  catch { return String(d).slice(0, 10) }
}

export function fmtRR(v) {
  const n = parseFloat(v)
  if (isNaN(n)) return '—'
  return (n >= 0 ? '+' : '') + n.toFixed(2) + 'R'
}