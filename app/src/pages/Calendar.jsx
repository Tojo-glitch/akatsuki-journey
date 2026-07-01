import React, { useState, useEffect } from 'react'
import { getDashboardStats } from '../lib/api'
import { Badge, Empty, fmtRR } from '../components/UI'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function Calendar({ toast }) {
  const [stats, setStats] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getDashboardStats().then(setStats).catch(e => toast(e.message, 'error'))
  }, [])

  const calMap = {}
  stats?.calendar?.forEach(d => { calMap[d.trade_date] = d })

  const navigate = (dir) => {
    setSelected(null)
    if (dir === -1 && month === 0) { setMonth(11); setYear(y => y - 1) }
    else if (dir === 1 && month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + dir)
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const moStr = String(month + 1).padStart(2, '0')

  // Month summary
  let mWin = 0, mLoss = 0, mMiss = 0, mRR = 0, mDays = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${year}-${moStr}-${String(d).padStart(2, '0')}`
    const dc = calMap[k]
    if (dc && dc.total > 0) {
      mWin += dc.win || 0
      mLoss += dc.loss || 0
      mMiss += dc.miss || 0
      mRR += parseFloat(dc.net_rr) || 0
      mDays++
    }
  }
  const mTotal = mWin + mLoss + mMiss
  const mWR = mTotal > 0 ? Math.round(mWin / (mWin + mLoss || 1) * 100) : 0
  mRR = Math.round(mRR * 100) / 100

  const selectedData = selected ? calMap[selected] : null

  return (
    <div>
      <div className="page-title">Calendar</div>
      <div className="page-sub">Daily P&amp;L — click any day to inspect</div>

      {/* Month stats */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        {[
          { label: 'Month Win Rate', val: mWR + '%', color: mWR >= 60 ? 'green' : mWR >= 45 ? 'yellow' : 'red', sub: `${mWin}W · ${mLoss}L · ${mMiss}M` },
          { label: 'Month Trades', val: mTotal, color: 'blue', sub: 'This month' },
          { label: 'Month Net R', val: (mRR >= 0 ? '+' : '') + mRR + 'R', color: mRR >= 0 ? 'green' : 'red', sub: 'Net R this month' },
          { label: 'Active Days', val: mDays, color: 'purple', sub: 'Days traded' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.color}`}>{s.val}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Navigation */}
        <div className="cal-nav">
          <button className="btn-ghost" style={{ padding: '6px 14px' }} onClick={() => navigate(-1)}>‹ Prev</button>
          <span className="cal-month">{MONTHS[month]} {year}</span>
          <button className="btn-ghost" style={{ padding: '6px 14px' }} onClick={() => navigate(1)}>Next ›</button>
        </div>

        {/* Day headers */}
        <div className="cal-grid" style={{ marginBottom: 4 }}>
          {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
        </div>

        {/* Calendar grid */}
        <div className="cal-grid">
          {/* Empty cells before first day */}
          {[...Array(firstDay)].map((_, i) => <div key={`e${i}`} className="cal-day empty" />)}

          {/* Days */}
          {[...Array(daysInMonth)].map((_, i) => {
            const d = i + 1
            const k = `${year}-${moStr}-${String(d).padStart(2, '0')}`
            const dc = calMap[k]
            const hasData = dc && dc.total > 0
            const isToday = k === todayStr
            const isSelected = k === selected
            const rr = dc ? parseFloat(dc.net_rr) : null

            return (
              <div key={d}
                className={`cal-day ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''}`}
                style={{
                  borderColor: isSelected ? 'var(--blue)' : undefined,
                  background: isSelected ? 'rgba(91,159,255,.08)' : undefined
                }}
                onClick={() => hasData && setSelected(k === selected ? null : k)}>
                <div className="cal-dn" style={{ color: isToday ? 'var(--green)' : undefined }}>{d}</div>
                {hasData && (
                  <>
                    <div className="cal-rr" style={{ color: rr > 0 ? 'var(--green)' : rr < 0 ? 'var(--red)' : 'var(--t2)' }}>
                      {rr > 0 ? '+' : ''}{rr}R
                    </div>
                    <div className="cal-dots">
                      {[...Array(dc.win || 0)].map((_, j) => <div key={`w${j}`} className="cdot w" />)}
                      {[...Array(dc.loss || 0)].map((_, j) => <div key={`l${j}`} className="cdot l" />)}
                      {[...Array(dc.miss || 0)].map((_, j) => <div key={`m${j}`} className="cdot m" />)}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && selectedData && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-header">
            <span className="section-title">{selected}</span>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
              color: parseFloat(selectedData.net_rr) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {parseFloat(selectedData.net_rr) >= 0 ? '+' : ''}{selectedData.net_rr}R
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 2 }}>Trades</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700 }}>{selectedData.total}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 2 }}>Win</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{selectedData.win}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 2 }}>Loss</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>{selectedData.loss}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 2 }}>Miss</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--yellow)' }}>{selectedData.miss}</div>
            </div>
          </div>
          <p style={{ marginTop: 10, fontSize: 12, color: 'var(--t2)' }}>
            Go to History and filter by date to see full trade details for this day.
          </p>
        </div>
      )}
    </div>
  )
}