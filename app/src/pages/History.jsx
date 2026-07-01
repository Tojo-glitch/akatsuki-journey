import React, { useState, useEffect, useCallback } from 'react'
import { getTrades, quickUpdateResult, deleteTrade } from '../lib/api'
import { Badge, Confirm, Lightbox, fmtDate, fmtRR } from '../components/UI'

export default function History({ config, requirePin, toast, onEdit }) {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ pair: 'all', result: 'all', session: 'all', setup: 'all' })
  const [lightbox, setLightbox] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTrades({ ...filters, limit: 500 })
      setTrades(data)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const handleQuickResult = useCallback((trade, result) => {
    requirePin(async pin => {
      const res = await quickUpdateResult(pin, trade.id, result)
      if (res?.success) { toast('Result updated'); load() }
      else toast(res?.message || 'Error', 'error')
    })
  }, [requirePin, toast, load])

  const handleDelete = useCallback((id) => {
    setConfirm({
      id, title: 'Delete Trade',
      msg: 'This trade will be permanently removed.'
    })
  }, [])

  const confirmDelete = useCallback(() => {
    const id = confirm.id
    setConfirm(null)
    requirePin(async pin => {
      const res = await deleteTrade(pin, id)
      if (res?.success) { toast('Trade deleted'); load() }
      else toast(res?.message || 'Error', 'error')
    })
  }, [confirm, requirePin, toast, load])

  const exportCSV = () => {
    setExporting(true)
    const headers = ['Date', 'Pair', 'Entry Time', 'Out Time', 'Session', 'Direction',
      'Setup', 'Entry', 'Target', 'SL', 'TP(R)', 'SL(R)', 'R:R', 'Result', 'Con.Loss',
      'Tags', 'Image', 'Video', 'Notes']
    const rows = trades.map(t => [
      t.trade_date, t.pair, t.time_entry, t.time_out, t.session, t.direction,
      t.setup_type, t.entry_price, t.target_price, t.stop_loss,
      t.tp_r, t.sl_r, t.rr, t.result, t.con_loss,
      (t.tags || []).join('|'), t.image_link, t.video_link,
      (t.notes || '').replace(/,/g, ';')
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `trades_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setExporting(false)
  }

  const totalW = trades.filter(t => t.result === 'Win').length
  const totalL = trades.filter(t => t.result === 'Loss').length
  const wr = trades.filter(t => t.result !== 'Miss').length
    ? Math.round(totalW / trades.filter(t => t.result !== 'Miss').length * 100) : 0

  return (
    <div>
      <div className="page-title">History</div>
      <div className="page-sub">
        {loading ? 'Loading…' : `${trades.length} trades · ${totalW}W ${totalL}L · ${wr}% win rate`}
      </div>

      {/* Filters */}
      <div className="filter-bar">
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
        <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }}
          onClick={exportCSV} disabled={exporting}>
          {exporting ? '…' : '↓ Export CSV'}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton skel-line" style={{ marginBottom: 10 }} />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div style={{ padding: 24 }}>
            <div className="empty"><div className="empty-icon">◎</div><p>No trades found</p></div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Pair</th><th>Time</th><th>Session</th>
                  <th>Dir</th><th>Setup</th><th>Entry</th><th>R:R</th>
                  <th>Con.L</th><th>Result</th><th>Media</th><th>Tags</th><th></th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.id}>
                    <td className="mono dim" style={{ fontSize: 11 }}>{i + 1}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmtDate(t.trade_date)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>{t.pair}</td>
                    <td className="mono dim" style={{ fontSize: 11 }}>{t.time_entry || '—'}</td>
                    <td><Badge type={t.session}>{t.session}</Badge></td>
                    <td><Badge type={t.direction}>{t.direction}</Badge></td>
                    <td style={{ fontSize: 11, color: 'var(--t2)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.setup_type || '—'}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{t.entry_price || '—'}</td>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--yellow)' }}>
                      {t.rr ? '1:' + t.rr : '—'}
                    </td>
                    <td className="mono neg" style={{ fontSize: 12 }}>{t.con_loss || ''}</td>

                    {/* Inline result quick-edit */}
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['Win', 'Loss', 'Miss'].map(r => (
                          <button key={r}
                            style={{
                              padding: '2px 6px', borderRadius: 4, border: '1px solid',
                              fontSize: 10, fontWeight: 700, cursor: 'pointer',
                              background: t.result === r
                                ? r === 'Win' ? 'rgba(38,217,160,.2)' : r === 'Loss' ? 'rgba(255,92,122,.2)' : 'rgba(255,200,87,.15)'
                                : 'transparent',
                              color: r === 'Win' ? 'var(--green)' : r === 'Loss' ? 'var(--red)' : 'var(--yellow)',
                              borderColor: t.result === r
                                ? r === 'Win' ? 'var(--green)' : r === 'Loss' ? 'var(--red)' : 'var(--yellow)'
                                : 'var(--border)',
                            }}
                            onClick={() => t.result !== r && handleQuickResult(t, r)}>
                            {r[0]}
                          </button>
                        ))}
                      </div>
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
                      {!t.image_link && !t.video_link && <span className="dim">—</span>}
                    </td>

                    {/* Tags */}
                    <td style={{ maxWidth: 120 }}>
                      {(t.tags || []).length > 0
                        ? <span style={{ fontSize: 10, color: 'var(--purple)' }}>{t.tags.join(', ')}</span>
                        : <span className="dim">—</span>}
                    </td>

                    {/* Actions */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn-icon" onClick={() => onEdit(t)} title="Edit">✎</button>
                      <button className="btn-icon del" onClick={() => handleDelete(t.id)}
                        style={{ marginLeft: 3 }} title="Delete">✕</button>
                    </td>
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