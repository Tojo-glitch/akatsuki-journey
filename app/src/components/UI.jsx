import React, { useRef, useEffect, useState } from 'react'

// ── Badge ──────────────────────────────────────────────────────
export function Badge({ type, children }) {
  const cls = {
    win: 'badge-win', loss: 'badge-loss', miss: 'badge-miss',
    buy: 'badge-buy', sell: 'badge-sell',
    Asia: 'badge-asia', London: 'badge-london', 'New York': 'badge-ny'
  }[type] || 'badge-miss'
  return <span className={`badge ${cls}`}>{children || type}</span>
}

// ── Skeleton ──────────────────────────────────────────────────
export function SkeletonStats() {
  return (
    <div className="stats-row" style={{ marginBottom: 16 }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton skel-stat" />)}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────
export function Empty({ icon = '◎', text = 'No data yet' }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <p>{text}</p>
    </div>
  )
}

// ── PIN Modal ──────────────────────────────────────────────────
export function PINModal({ open, onConfirm, onClose }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = [...Array(6)].map(() => useRef(null))

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
    if (e.key === 'Enter') confirm()
  }

  const handleInput = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const d = [...digits]; d[i] = val; setDigits(d)
    if (val && i < 5) refs[i + 1].current?.focus()
  }

  const confirm = async () => {
    const pin = digits.join('')
    if (pin.length < 6) { setError('Enter all 6 digits'); return }
    setLoading(true)
    const ok = await onConfirm(pin)
    if (!ok) {
      setError('Incorrect PIN')
      setDigits(['', '', '', '', '', ''])
      refs[0].current?.focus()
    }
    setLoading(false)
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ fontSize: 32, marginBottom: 6 }}>🔐</div>
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: 4 }}>Enter PIN</h3>
        <p style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 4 }}>6-digit PIN required to continue</p>
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
        <div className="pin-error">{error}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={confirm} disabled={loading}>
            {loading ? 'Checking…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm dialog ─────────────────────────────────────────────
export function Confirm({ open, title, msg, onYes, onNo }) {
  if (!open) return null
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onNo()}>
      <div className="modal" style={{ maxWidth: 340 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 20 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-ghost" onClick={onNo}>Cancel</button>
          <button className="btn-danger" onClick={onYes}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Toast list ─────────────────────────────────────────────────
export function ToastList({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── Count-up number animation ──────────────────────────────────
export function CountUp({ value, suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const target = parseFloat(value) || 0
    const start = Date.now()
    const dur = 600
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(+(target * ease).toFixed(decimals))
      if (p < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return <>{display}{suffix}</>
}

// ── Lightbox ───────────────────────────────────────────────────
export function Lightbox({ src, onClose }) {
  if (!src) return null
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <img src={src} alt="Trade chart" onClick={e => e.stopPropagation()} />
    </div>
  )
}

// ── Helpers (exported for reuse) ───────────────────────────────
export function fmtDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) }
  catch { return String(d).slice(0, 10) }
}

export function fmtRR(v) {
  const n = parseFloat(v)
  if (isNaN(n)) return '—'
  return (n >= 0 ? '+' : '') + n + 'R'
}

export function sessionBadgeType(s) {
  return s === 'Asia' ? 'Asia' : s === 'London' ? 'London' : 'New York'
}