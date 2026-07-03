import React, { useState, useEffect } from 'react'
import { getDashboardStats, getTrades } from '../lib/api'
import { Badge, fmtDate } from '../components/UI'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function Calendar({ toast, isOwner, onEdit }) {
  const [stats,    setStats]    = useState(null)
  const [year,     setYear]     = useState(new Date().getFullYear())
  const [month,    setMonth]    = useState(new Date().getMonth())
  const [selected, setSelected] = useState(null)      // selected date string
  const [dayTrades, setDayTrades] = useState([])      // trades for selected day
  const [loadingDay, setLoadingDay] = useState(false)

  useEffect(() => {
    getDashboardStats().then(setStats).catch(e => toast(e.message, 'error'))
  }, [])

  const calMap = {}
  stats?.calendar?.forEach(d => { calMap[d.trade_date] = d })

  const navigate = dir => {
    setSelected(null)
    setDayTrades([])
    if (dir === -1 && month === 0) { setMonth(11); setYear(y => y - 1) }
    else if (dir === 1 && month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + dir)
  }

  const todayStr   = new Date().toISOString().slice(0, 10)
  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const moStr      = String(month + 1).padStart(2, '0')

  // Month summary
  let mWin=0, mLoss=0, mMiss=0, mRR=0, mDays=0
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${year}-${moStr}-${String(d).padStart(2,'0')}`
    const dc = calMap[k]
    if (dc && dc.total > 0) {
      mWin  += dc.win  || 0
      mLoss += dc.loss || 0
      mMiss += dc.miss || 0
      mRR   += parseFloat(dc.net_rr) || 0
      mDays++
    }
  }
  const mTotal = mWin + mLoss + mMiss
  const mWR  = (mWin + mLoss) > 0 ? Math.round(mWin / (mWin + mLoss) * 100) : 0
  mRR = Math.round(mRR * 100) / 100

  // Click a calendar day → load trades for that date
  const handleDayClick = async (dateStr, dc) => {
    if (!dc || dc.total === 0) return
    if (selected === dateStr) { setSelected(null); setDayTrades([]); return }
    setSelected(dateStr)
    setDayTrades([])
    setLoadingDay(true)
    try {
      const trades = await getTrades({ from: dateStr, to: dateStr, limit: 50 })
      setDayTrades(trades)
    } catch (e) { toast(e.message, 'error') }
    setLoadingDay(false)
  }

  const selectedData = selected ? calMap[selected] : null

  return (
    <div>
      <div className="page-title">Calendar</div>
      <div className="page-sub">Daily P&L — click any day to see trades</div>

      {/* Month summary stats */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        {[
          { label:'MONTH WIN RATE', val: mTotal>0 ? mWR+'%' : '—',
            color: mWR>=60?'green':mWR>=45?'yellow':'red',
            sub: `${mWin}W · ${mLoss}L · ${mMiss}M` },
          { label:'MONTH TRADES',   val: mTotal,   color:'blue',               sub:'This month' },
          { label:'MONTH NET R',    val: mRR>=0?`+${mRR}R`:`${mRR}R`,
            color: mRR>=0?'green':'red', sub:'Net R' },
          { label:'TRADING DAYS',   val: mDays,    color:'purple',             sub:'Active days' },
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
          <button className="btn-ghost" style={{ padding:'6px 14px' }} onClick={() => navigate(-1)}>‹ Prev</button>
          <span className="cal-month">{MONTHS[month]} {year}</span>
          <button className="btn-ghost" style={{ padding:'6px 14px' }} onClick={() => navigate(1)}>Next ›</button>
        </div>

        {/* Day headers */}
        <div className="cal-grid" style={{ marginBottom: 4 }}>
          {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
        </div>

        {/* Calendar cells */}
        <div className="cal-grid">
          {[...Array(firstDay)].map((_,i) => <div key={`e${i}`} className="cal-day empty" />)}
          {[...Array(daysInMonth)].map((_,i) => {
            const d      = i + 1
            const k      = `${year}-${moStr}-${String(d).padStart(2,'0')}`
            const dc     = calMap[k]
            const hasData = dc && dc.total > 0
            const isToday = k === todayStr
            const isSel   = k === selected
            const rr      = dc ? parseFloat(dc.net_rr) : null

            return (
              <div key={d}
                className={`cal-day${hasData?' has-data':''}${isToday?' today':''}${dc?.total===0||!dc?' empty-day':''}`}
                style={{
                  borderColor: isSel ? 'var(--blue)' : isToday ? 'rgba(38,217,160,.5)' : undefined,
                  background:  isSel ? 'rgba(91,159,255,.07)' : undefined,
                  cursor: hasData ? 'pointer' : 'default',
                }}
                onClick={() => handleDayClick(k, dc)}>
                <div className="cal-dn" style={{ color: isToday ? 'var(--green)' : undefined }}>{d}</div>
                {hasData && (
                  <>
                    <div className="cal-rr" style={{
                      color: rr > 0 ? 'var(--green)' : rr < 0 ? 'var(--red)' : 'var(--t2)'
                    }}>
                      {rr > 0 ? '+' : ''}{rr}R
                    </div>
                    <div className="cal-dots">
                      {[...Array(Math.min(dc.win  || 0, 5))].map((_,j) => <div key={`w${j}`} className="cdot w"/>)}
                      {[...Array(Math.min(dc.loss || 0, 5))].map((_,j) => <div key={`l${j}`} className="cdot l"/>)}
                      {[...Array(Math.min(dc.miss || 0, 3))].map((_,j) => <div key={`m${j}`} className="cdot m"/>)}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selected && selectedData && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-header">
            <span className="section-title">
              {new Date(selected + 'T00:00:00').toLocaleDateString('en-GB',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </span>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
              color: parseFloat(selectedData.net_rr) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {parseFloat(selectedData.net_rr) >= 0 ? '+' : ''}{selectedData.net_rr}R
            </span>
          </div>

          {/* Day summary */}
          <div style={{ display:'flex', gap:20, flexWrap:'wrap', marginBottom:14 }}>
            {[
              ['Trades', selectedData.total,   'var(--text)'],
              ['Win',    selectedData.win,      'var(--green)'],
              ['Loss',   selectedData.loss,     'var(--red)'],
              ['Miss',   selectedData.miss,     'var(--yellow)'],
            ].map(([lbl, val, color]) => (
              <div key={lbl} style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--t2)', marginBottom:2 }}>{lbl}</div>
                <div style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:700, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Trade list for this day */}
          {loadingDay ? (
            <div style={{ padding:16 }}>
              {[...Array(3)].map((_,i) => (
                <div key={i} className="skeleton skel-line" style={{ marginBottom:8 }} />
              ))}
            </div>
          ) : dayTrades.length === 0 ? (
            <p style={{ fontSize:13, color:'var(--t2)' }}>Loading trade details…</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th><th>Pair</th><th>Dir</th><th>Setup</th>
                    <th>Entry</th><th>R:R</th><th>Result</th><th>Media</th>
                    {isOwner && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {dayTrades.map(t => (
                    <tr key={t.id}>
                      <td className="mono dim" style={{ fontSize:11, whiteSpace:'nowrap' }}>
                        {t.time_entry || '—'}
                        {t.time_out && <> → {t.time_out}</>}
                        {t.exit_date && t.exit_date !== t.trade_date && (
                          <div style={{ fontSize:10, color:'var(--yellow)' }}>→ {fmtDate(t.exit_date)}</div>
                        )}
                      </td>
                      <td style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:12 }}>{t.pair}</td>
                      <td><Badge type={t.direction}>{t.direction}</Badge></td>
                      <td style={{ fontSize:11, color:'var(--t2)' }}>{t.setup_type || '—'}</td>
                      <td className="mono" style={{ fontSize:11 }}>{t.entry_price || '—'}</td>
                      <td className="mono" style={{ color:'var(--yellow)', fontSize:11 }}>
                        {t.rr ? '1:'+t.rr : '—'}
                      </td>
                      <td><Badge type={t.result}>{t.result}</Badge></td>
                      <td style={{ whiteSpace:'nowrap', fontSize:13 }}>
                        {t.image_link && (
                          <a href={t.image_link} target="_blank" rel="noreferrer"
                             style={{ marginRight:4 }} title="View chart">🖼</a>
                        )}
                        {t.video_link && (
                          <a href={t.video_link} target="_blank" rel="noreferrer" title="Watch video">▶</a>
                        )}
                        {!t.image_link && !t.video_link && <span style={{ color:'var(--t3)' }}>—</span>}
                      </td>
                      {isOwner && (
                        <td>
                          <button className="btn-icon" style={{ fontSize:12 }}
                            onClick={() => onEdit && onEdit(t)} title="Edit">✎</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tags and notes summary */}
          {dayTrades.some(t => (t.tags||[]).length > 0 || t.notes) && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
              {dayTrades.filter(t => (t.tags||[]).length > 0).map(t => (
                <div key={t.id} style={{ fontSize:11, color:'var(--purple)', marginBottom:4 }}>
                  <span style={{ color:'var(--t3)' }}>{t.pair} tags:</span> {t.tags.join(', ')}
                </div>
              ))}
              {dayTrades.filter(t => t.notes).map(t => (
                <div key={t.id} style={{ fontSize:12, color:'var(--t2)', marginTop:4 }}>
                  <span style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>{t.pair}:</span> {t.notes}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}