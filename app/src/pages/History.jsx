import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getTrades, quickUpdateResult, deleteTrade } from '../lib/api'
import { Badge, Confirm, Lightbox, fmtDate } from '../components/UI'

// ── Sort trades: by date desc, then time_entry desc ──────────────
function sortTrades(trades) {
  return [...trades].sort((a, b) => {
    const dA = a.trade_date || '', dB = b.trade_date || ''
    if (dA !== dB) return dB.localeCompare(dA)
    const tA = a.time_entry || '', tB = b.time_entry || ''
    return tB.localeCompare(tA)
  })
}

// ── Detect duplicates: same pair + date + entry_price ────────────
function markDuplicates(trades) {
  const seen = {}
  return trades.map(t => {
    const key = `${t.pair}|${t.trade_date}|${t.entry_price}`
    const isDup = !!seen[key]
    seen[key] = true
    return { ...t, isDuplicate: isDup }
  })
}

// ── Inline result buttons ─────────────────────────────────────────
function ResultButtons({ trade, onUpdate, isOwner }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {['Win', 'Loss', 'Miss'].map(r => (
        <button key={r}
          disabled={!isOwner}
          title={isOwner ? `Mark as ${r}` : 'PIN required'}
          style={{
            padding: '2px 6px', borderRadius: 4, border: '1px solid',
            fontSize: 10, fontWeight: 700,
            cursor: isOwner ? 'pointer' : 'not-allowed',
            opacity: isOwner ? 1 : 0.5,
            background: trade.result === r
              ? r === 'Win' ? 'rgba(38,217,160,.2)' : r === 'Loss' ? 'rgba(255,92,122,.2)' : 'rgba(255,200,87,.15)'
              : 'transparent',
            color: r === 'Win' ? 'var(--green)' : r === 'Loss' ? 'var(--red)' : 'var(--yellow)',
            borderColor: trade.result === r
              ? r === 'Win' ? 'var(--green)' : r === 'Loss' ? 'var(--red)' : 'var(--yellow)'
              : 'var(--border)',
          }}
          onClick={() => isOwner && trade.result !== r && onUpdate(trade, r)}>
          {r[0]}
        </button>
      ))}
    </div>
  )
}

export default function History({ config, requirePin, toast, onEdit, isOwner }) {
  const [trades,    setTrades]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filters,   setFilters]   = useState({ pair: 'all', result: 'all', session: 'all', setup: 'all' })
  const [search,    setSearch]    = useState('')
  const [lightbox,  setLightbox]  = useState(null)
  const [confirm,   setConfirm]   = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTrades({ ...filters, limit: 500 })
      setTrades(sortTrades(data))
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  // Apply search + mark duplicates
  const displayed = useMemo(() => {
    let list = trades
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        (t.pair || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.setup_type || '').toLowerCase().includes(q) ||
        (t.tags || []).some(tg => tg.toLowerCase().includes(q))
      )
    }
    return markDuplicates(list)
  }, [trades, search])

  // Stats from current filtered list
  const totalW = displayed.filter(t => t.result === 'Win').length
  const totalL = displayed.filter(t => t.result === 'Loss').length
  const eligible = displayed.filter(t => t.result !== 'Miss').length
  const wr = eligible ? Math.round(totalW / eligible * 100) : 0
  const netR = displayed.reduce((s, t) => {
    if (t.result === 'Win')  return s + (parseFloat(t.rr) || 1)
    if (t.result === 'Loss') return s - 1
    return s
  }, 0)

  const handleQuickResult = useCallback((trade, result) => {
    requirePin(async pin => {
      const res = await quickUpdateResult(pin, trade.id, result)
      if (res?.success) { toast('Result updated'); load() }
      else toast(res?.message || 'Error', 'error')
    })
  }, [requirePin, toast, load])

  const handleDelete = useCallback((id) => {
    setConfirm({ id, title: 'Delete Trade', msg: 'This trade will be permanently removed. This cannot be undone.' })
  }, [])

  const confirmDelete = useCallback(() => {
    const id = confirm.id
    setConfirm(null)
    requirePin(async pin => {
      try {
        const res = await deleteTrade(pin, id)
        if (res?.success) { toast('Trade deleted'); load() }
        else toast(res?.message || 'Delete failed', 'error')
      } catch (e) { toast(e.message, 'error') }
    })
  }, [confirm, requirePin, toast, load])

  const exportCSV = () => {
    setExporting(true)
    const headers = ['Date','Exit Date','Pair','Entry Time','Exit Time','Session','Direction',
      'Setup','Entry','Target','SL','TP(R)','SL(R)','R:R','Lot','Loss Amount',
      'Result','Con.Loss','Tags','Image','Video','Notes']
    const rows = displayed.map(t => [
      t.trade_date, t.exit_date||'', t.pair, t.time_entry||'', t.time_out||'',
      t.session||'', t.direction||'', t.setup_type||'',
      t.entry_price||'', t.target_price||'', t.stop_loss||'',
      t.tp_r||'', t.sl_r||'', t.rr||'',
      t.lot_size||'', t.loss_amount||'',
      t.result||'', t.con_loss||'',
      (t.tags||[]).join('|'), t.image_link||'', t.video_link||'',
      `"${(t.notes||'').replace(/"/g,'""')}"`
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `trades_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    setExporting(false)
  }

  return (
    <div>
      <div className="page-title">History</div>

      {/* Summary stats */}
      {!loading && displayed.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--t2)' }}>{displayed.length} trades</span>
          <span style={{ fontSize: 13, color: 'var(--green)' }}>{totalW}W</span>
          <span style={{ fontSize: 13, color: 'var(--red)' }}>{totalL}L</span>
          <span style={{ fontSize: 13, color: 'var(--t2)' }}>WR: <strong style={{ color: wr>=50?'var(--green)':'var(--red)' }}>{wr}%</strong></span>
          <span style={{ fontSize: 13, fontFamily: 'var(--mono)', color: netR>=0?'var(--green)':'var(--red)' }}>
            Net: {netR>=0?'+':''}{netR.toFixed(2)}R
          </span>
          {!isOwner && (
            <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>
              🔐 Read-only — enter owner mode to edit
            </span>
          )}
        </div>
      )}

      {/* Filters + Search */}
      <div className="filter-bar">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search pair, notes, setup, tag…"
          style={{ minWidth: 180 }}
        />
        <select value={filters.pair} onChange={e => setF('pair', e.target.value)}>
          <option value="all">All Pairs</option>
          {config.pairs.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filters.result} onChange={e => setF('result', e.target.value)}>
          <option value="all">All Results</option>
          <option>Win</option><option>Loss</option><option>Miss</option>
        </select>
        <select value={filters.session} onChange={e => setF('session', e.target.value)}>
          <option value="all">All Sessions</option>
          <option>Asia</option><option>London</option><option value="New York">New York</option>
        </select>
        <select value={filters.setup} onChange={e => setF('setup', e.target.value)}>
          <option value="all">All Setups</option>
          {config.setupTypes.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 12, whiteSpace: 'nowrap' }}
          onClick={exportCSV} disabled={exporting}>
          {exporting ? '…' : '↓ CSV'}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="skeleton skel-line" style={{ marginBottom: 10, width: i%2===0?'100%':'80%' }} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t2)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>◎</div>
            <p>{search ? `No trades matching "${search}"` : 'No trades found'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date ↓</th>
                  <th>Pair</th>
                  <th>In / Out</th>
                  <th>Session</th>
                  <th>Dir</th>
                  <th>Setup</th>
                  <th>Entry</th>
                  <th>R:R</th>
                  <th>Con.L</th>
                  <th>Result</th>
                  <th>Media</th>
                  <th>Tags</th>
                  {isOwner && <th></th>}
                </tr>
              </thead>
              <tbody>
                {displayed.map((t, i) => (
                  <tr key={t.id} style={{
                    background: t.isDuplicate ? 'rgba(255,200,87,.04)' : undefined,
                  }}>
                    <td className="mono dim" style={{ fontSize: 11 }}>{i + 1}</td>

                    {/* Date — show exit date if different */}
                    <td style={{ fontSize: 11 }}>
                      <div className="mono">{fmtDate(t.trade_date)}</div>
                      {t.exit_date && t.exit_date !== t.trade_date && (
                        <div className="mono" style={{ color: 'var(--yellow)', fontSize: 10 }}>
                          →{fmtDate(t.exit_date)}
                        </div>
                      )}
                      {t.isDuplicate && (
                        <div style={{ fontSize: 9, color: 'var(--yellow)', fontWeight: 700 }}>⚠ DUP</div>
                      )}
                    </td>

                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>{t.pair}</td>

                    {/* Entry/Exit time */}
                    <td className="mono dim" style={{ fontSize: 10 }}>
                      <div>{t.time_entry || '—'}</div>
                      {t.time_out && <div style={{ color: 'var(--t3)' }}>{t.time_out}</div>}
                    </td>

                    <td><Badge type={t.session}>{t.session || '—'}</Badge></td>
                    <td><Badge type={t.direction}>{t.direction || '—'}</Badge></td>

                    <td style={{ fontSize: 11, color: 'var(--t2)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.setup_type || '—'}
                    </td>

                    <td className="mono" style={{ fontSize: 11 }}>
                      <div>{t.entry_price || '—'}</div>
                      {t.lot_size && <div style={{ color: 'var(--t3)', fontSize: 10 }}>lot:{t.lot_size}</div>}
                    </td>

                    <td className="mono" style={{ color: 'var(--yellow)', fontSize: 11 }}>
                      {t.rr ? '1:'+t.rr : '—'}
                    </td>

                    <td>
                      <div className="mono neg" style={{ fontSize: 11 }}>{t.con_loss || ''}</div>
                      {t.loss_amount ? (
                        <div style={{ fontSize: 10, color: 'var(--red)' }}>-${t.loss_amount}</div>
                      ) : null}
                    </td>

                    {/* Inline result quick-edit */}
                    <td>
                      <ResultButtons trade={t} onUpdate={handleQuickResult} isOwner={isOwner} />
                    </td>

                    {/* Media */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {t.image_link
                        ? <button className="btn-icon" onClick={() => setLightbox(t.image_link)} title="View chart">🖼</button>
                        : null}
                      {t.video_link
                        ? <a href={t.video_link} target="_blank" rel="noreferrer"
                            className="btn-icon" style={{ textDecoration: 'none', marginLeft: 3 }}>▶</a>
                        : null}
                      {!t.image_link && !t.video_link && <span className="dim" style={{fontSize:11}}>—</span>}
                    </td>

                    {/* Tags */}
                    <td style={{ maxWidth: 110 }}>
                      {(t.tags || []).length > 0
                        ? <span style={{ fontSize: 10, color: 'var(--purple)', lineHeight: 1.4 }}>{t.tags.join(', ')}</span>
                        : <span className="dim" style={{fontSize:11}}>—</span>}
                    </td>

                    {/* Edit / Delete — owner only */}
                    {isOwner && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn-icon" onClick={() => onEdit(t)} title="Edit">✎</button>
                        <button className="btn-icon del" onClick={() => handleDelete(t.id)}
                          style={{ marginLeft: 3 }} title="Delete">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
      <Confirm
        open={!!confirm}
        title={confirm?.title}
        msg={confirm?.msg}
        onYes={confirmDelete}
        onNo={() => setConfirm(null)}
      />
    </div>
  )
}