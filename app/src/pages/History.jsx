import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getTrades, quickUpdateResult, deleteTrade, importTradesBatch } from '../lib/api'
import { Badge, Confirm, Lightbox, fmtDate } from '../components/UI'

const PAGE_SIZE = 50

function sortTrades(trades) {
  return [...trades].sort((a, b) => {
    const dA = a.trade_date || '', dB = b.trade_date || ''
    if (dA !== dB) return dB.localeCompare(dA)
    return (b.time_entry || '').localeCompare(a.time_entry || '')
  })
}

function markDuplicates(trades) {
  const seen = {}
  return trades.map(t => {
    const key = `${t.pair}|${t.trade_date}|${t.entry_price}`
    const isDup = !!seen[key]
    seen[key] = true
    return { ...t, isDuplicate: isDup }
  })
}

function ResultButtons({ trade, onUpdate, isOwner }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {['Win','Loss','Miss'].map(r => (
        <button key={r}
          disabled={!isOwner}
          title={isOwner ? `Mark as ${r}` : 'Owner mode required'}
          onClick={() => isOwner && trade.result !== r && onUpdate(trade, r)}
          style={{
            padding:'2px 6px', borderRadius:4, border:'1px solid',
            fontSize:10, fontWeight:700,
            cursor: isOwner ? 'pointer' : 'not-allowed',
            opacity: isOwner ? 1 : 0.45,
            background: trade.result === r
              ? r==='Win' ? 'rgba(38,217,160,.2)' : r==='Loss' ? 'rgba(255,92,122,.2)' : 'rgba(255,200,87,.15)'
              : 'transparent',
            color: r==='Win' ? 'var(--green)' : r==='Loss' ? 'var(--red)' : 'var(--yellow)',
            borderColor: trade.result === r
              ? r==='Win' ? 'var(--green)' : r==='Loss' ? 'var(--red)' : 'var(--yellow)'
              : 'var(--border)',
          }}>
          {r[0]}
        </button>
      ))}
    </div>
  )
}

// ── CSV parser for import ─────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g,''))
  return lines.slice(1).map(line => {
    const vals = line.split(',')
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i]||'').replace(/^"|"$/g,'').trim() })
    // Map CSV headers to DB fields
    return {
      pair:         obj.pair || '',
      trade_date:   obj.date || obj.trade_date || '',
      exit_date:    obj.exit_date || '',
      time_entry:   obj.entry_time || obj.time_entry || '',
      time_out:     obj.exit_time  || obj.time_out   || '',
      direction:    obj.direction  || obj.dir         || '',
      setup_type:   obj.setup      || obj.setup_type  || '',
      entry_price:  obj.entry      || obj.entry_price || '',
      target_price: obj.target     || obj.target_price|| '',
      stop_loss:    obj.sl         || obj.stop_loss   || '',
      tick_size:    obj.tick_size  || '',
      lot_size:     obj.lot        || obj.lot_size    || '',
      loss_amount:  obj.loss_amount|| '',
      result:       obj.result     || '',
      image_link:   obj.image      || obj.image_link  || '',
      video_link:   obj.video      || obj.video_link  || '',
      notes:        obj.notes      || '',
      tags:         obj.tags ? obj.tags.split('|').filter(Boolean) : [],
    }
  }).filter(r => r.pair && r.trade_date)
}

export default function History({ config, requirePin, toast, onEdit, isOwner }) {
  const [trades,    setTrades]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filters,   setFilters]   = useState({ pair:'all', result:'all', session:'all', setup:'all' })
  const [search,    setSearch]    = useState('')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [page,      setPage]      = useState(1)
  const [lightbox,  setLightbox]  = useState(null)
  const [confirm,   setConfirm]   = useState(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true); setPage(1)
    try {
      const data = await getTrades({ ...filters, from: dateFrom||undefined, to: dateTo||undefined, limit: 1000 })
      setTrades(sortTrades(data))
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }, [filters, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  // Filter + search + duplicate mark
  const allFiltered = useMemo(() => {
    let list = trades
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        (t.pair||'').toLowerCase().includes(q) ||
        (t.notes||'').toLowerCase().includes(q) ||
        (t.setup_type||'').toLowerCase().includes(q) ||
        (t.tags||[]).some(tg => tg.toLowerCase().includes(q))
      )
    }
    return markDuplicates(list)
  }, [trades, search])

  // Pagination
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE)
  const displayed  = allFiltered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  // Summary stats over ALL filtered (not just current page)
  const totalW = allFiltered.filter(t => t.result==='Win').length
  const totalL = allFiltered.filter(t => t.result==='Loss').length
  const eligible = allFiltered.filter(t => t.result!=='Miss').length
  const wr = eligible ? Math.round(totalW/eligible*100) : 0
  const netR = allFiltered.reduce((s,t) => {
    if (t.result==='Win')  return s + (parseFloat(t.rr)||1)
    if (t.result==='Loss') return s - 1
    return s
  }, 0)
  const totalLossAmt = allFiltered.reduce((s,t) =>
    t.result==='Loss' ? s + (parseFloat(t.loss_amount)||0) : s, 0)

  const handleQuickResult = useCallback((trade, result) => {
    requirePin(async pin => {
      const res = await quickUpdateResult(pin, trade.id, result)
      if (res?.success) { toast('Result updated'); load() }
      else toast(res?.message||'Error','error')
    })
  }, [requirePin, toast, load])

  const handleDelete = useCallback((id) => {
    setConfirm({ id, title:'Delete Trade', msg:'This trade will be permanently removed.' })
  }, [])

  const confirmDelete = useCallback(() => {
    const id = confirm.id; setConfirm(null)
    requirePin(async pin => {
      try {
        const res = await deleteTrade(pin, id)
        if (res?.success) { toast('Trade deleted'); load() }
        else toast(res?.message||'Delete failed','error')
      } catch (e) { toast(e.message,'error') }
    })
  }, [confirm, requirePin, toast, load])

  // Export CSV
  const exportCSV = useCallback(() => {
    setExporting(true)
    const headers = ['Date','Exit Date','Pair','Entry Time','Exit Time','Session','Direction',
      'Setup','Entry','Target','SL','TP(R)','SL(R)','R:R','Lot','Loss Amount',
      'Result','Con.Loss','Tags','Image','Video','Notes']
    const rows = allFiltered.map(t => [
      t.trade_date, t.exit_date||'', t.pair,
      t.time_entry||'', t.time_out||'', t.session||'', t.direction||'',
      t.setup_type||'', t.entry_price||'', t.target_price||'', t.stop_loss||'',
      t.tp_r||'', t.sl_r||'', t.rr||'', t.lot_size||'', t.loss_amount||'',
      t.result||'', t.con_loss||'',
      (t.tags||[]).join('|'), t.image_link||'', t.video_link||'',
      `"${(t.notes||'').replace(/"/g,'""')}"`,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `trades_${new Date().toISOString().slice(0,10)}.csv`; a.click()
    setExporting(false)
  }, [allFiltered])

  // Import CSV
  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result)
      if (rows.length === 0) { toast('No valid rows found in CSV','error'); return }
      setConfirm({
        isImport: true,
        rows,
        title: `Import ${rows.length} trades?`,
        msg: `Found ${rows.length} valid rows. Existing trades will NOT be replaced. Continue?`,
      })
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [toast])

  const confirmImport = useCallback(() => {
    const rows = confirm.rows; setConfirm(null)
    requirePin(async pin => {
      setImporting(true)
      try {
        const res = await importTradesBatch(pin, rows)
        if (res?.success) { toast(res.message||'Imported'); load() }
        else toast(res?.message||'Import failed','error')
      } catch (e) { toast(e.message,'error') }
      setImporting(false)
    })
  }, [confirm, requirePin, toast, load])

  return (
    <div>
      <div className="page-title">History</div>

      {/* Stats bar */}
      {!loading && allFiltered.length > 0 && (
        <div style={{ display:'flex', gap:14, marginBottom:14, flexWrap:'wrap', alignItems:'center',
          padding:'10px 14px', background:'var(--card)', borderRadius:10, border:'1px solid var(--border)' }}>
          <span style={{ fontSize:13, color:'var(--t2)' }}>{allFiltered.length} trades</span>
          <span style={{ color:'var(--green)', fontSize:13 }}>{totalW}W</span>
          <span style={{ color:'var(--red)', fontSize:13 }}>{totalL}L</span>
          <span style={{ fontSize:13 }}>
            WR: <strong style={{ color:wr>=50?'var(--green)':'var(--red)', fontFamily:'var(--mono)' }}>{wr}%</strong>
          </span>
          <span style={{ fontFamily:'var(--mono)', fontSize:13, color:netR>=0?'var(--green)':'var(--red)' }}>
            {netR>=0?'+':''}{netR.toFixed(2)}R
          </span>
          {totalLossAmt > 0 && (
            <span style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--red)' }}>
              -${totalLossAmt.toFixed(2)}
            </span>
          )}
          {!isOwner && <span style={{ fontSize:11, color:'var(--t3)', marginLeft:'auto' }}>🔐 Read-only</span>}
        </div>
      )}

      {/* Filters row 1: search + date range */}
      <div className="filter-bar" style={{ marginBottom:6 }}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
          placeholder="🔍 Search pair, notes, setup, tag…"
          style={{ minWidth:180, flex:1 }} />
        <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}}
          title="From date" style={{ maxWidth:140 }} />
        <span style={{ color:'var(--t3)', fontSize:12, alignSelf:'center' }}>→</span>
        <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}}
          title="To date" style={{ maxWidth:140 }} />
        {(dateFrom||dateTo) && (
          <button className="btn-ghost" style={{ fontSize:12, padding:'6px 10px' }}
            onClick={()=>{setDateFrom('');setDateTo('');setPage(1)}}>✕ Clear</button>
        )}
      </div>

      {/* Filters row 2: dropdowns + actions */}
      <div className="filter-bar">
        <select value={filters.pair} onChange={e=>{setF('pair',e.target.value);setPage(1)}}>
          <option value="all">All Pairs</option>
          {config.pairs.map(p=><option key={p}>{p}</option>)}
        </select>
        <select value={filters.result} onChange={e=>{setF('result',e.target.value);setPage(1)}}>
          <option value="all">All Results</option>
          <option>Win</option><option>Loss</option><option>Miss</option>
        </select>
        <select value={filters.session} onChange={e=>{setF('session',e.target.value);setPage(1)}}>
          <option value="all">All Sessions</option>
          <option>Asia</option><option>London</option><option value="New York">New York</option>
        </select>
        <select value={filters.setup} onChange={e=>{setF('setup',e.target.value);setPage(1)}}>
          <option value="all">All Setups</option>
          {config.setupTypes.map(s=><option key={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button className="btn-ghost" style={{ fontSize:12 }} onClick={exportCSV} disabled={exporting}>
            {exporting ? '…' : '↓ CSV'}
          </button>
          {isOwner && (
            <>
              <button className="btn-ghost" style={{ fontSize:12 }}
                onClick={()=>fileRef.current?.click()} disabled={importing}>
                {importing ? '⏳' : '↑ Import'}
              </button>
              <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleImportFile} />
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0 }}>
        {loading ? (
          <div style={{ padding:24 }}>
            {[...Array(7)].map((_,i)=>(
              <div key={i} className="skeleton skel-line" style={{ marginBottom:10, width:i%2===0?'100%':'80%' }} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'var(--t2)' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>◎</div>
            <p>{search ? `No trades matching "${search}"` : 'No trades found'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Date ↓</th><th>Pair</th><th>In / Out</th>
                  <th>Sess</th><th>Dir</th><th>Setup</th><th>Entry</th>
                  <th>R:R</th><th>Con.L / Loss$</th><th>Result</th>
                  <th>Media</th><th>Tags</th>
                  {isOwner && <th></th>}
                </tr>
              </thead>
              <tbody>
                {displayed.map((t,i) => (
                  <tr key={t.id} style={{ background: t.isDuplicate ? 'rgba(255,200,87,.03)' : undefined }}>
                    <td className="mono dim" style={{ fontSize:10 }}>{(page-1)*PAGE_SIZE+i+1}</td>

                    <td style={{ fontSize:11, minWidth:72 }}>
                      <div className="mono">{fmtDate(t.trade_date)}</div>
                      {t.exit_date && t.exit_date !== t.trade_date && (
                        <div className="mono" style={{ color:'var(--yellow)', fontSize:10 }}>→{fmtDate(t.exit_date)}</div>
                      )}
                      {t.isDuplicate && <div style={{ fontSize:9, color:'var(--yellow)', fontWeight:700 }}>⚠ DUP</div>}
                    </td>

                    <td style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:12 }}>{t.pair}</td>

                    <td className="mono dim" style={{ fontSize:10 }}>
                      <div>{t.time_entry||'—'}</div>
                      {t.time_out && <div style={{ color:'var(--t3)' }}>{t.time_out}</div>}
                    </td>

                    <td><Badge type={t.session}>{t.session||'—'}</Badge></td>
                    <td><Badge type={t.direction}>{t.direction||'—'}</Badge></td>

                    <td style={{ fontSize:11, color:'var(--t2)', maxWidth:88, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {t.setup_type||'—'}
                    </td>

                    <td className="mono" style={{ fontSize:11 }}>
                      <div>{t.entry_price||'—'}</div>
                      {t.lot_size && <div style={{ color:'var(--t3)', fontSize:10 }}>lot:{t.lot_size}</div>}
                    </td>

                    <td className="mono" style={{ color:'var(--yellow)', fontSize:11 }}>{t.rr?'1:'+t.rr:'—'}</td>

                    <td>
                      {t.con_loss ? <div className="mono neg" style={{ fontSize:11 }}>{t.con_loss}×</div> : null}
                      {t.loss_amount ? <div style={{ fontSize:10, color:'var(--red)' }}>-${t.loss_amount}</div> : null}
                      {!t.con_loss && !t.loss_amount && <span className="dim" style={{ fontSize:11 }}>—</span>}
                    </td>

                    <td><ResultButtons trade={t} onUpdate={handleQuickResult} isOwner={isOwner} /></td>

                    <td style={{ whiteSpace:'nowrap' }}>
                      {t.image_link && (
                        <button className="btn-icon" onClick={()=>setLightbox(t.image_link)} title="View chart">🖼</button>
                      )}
                      {t.video_link && (
                        <a href={t.video_link} target="_blank" rel="noreferrer"
                          className="btn-icon" style={{ textDecoration:'none', marginLeft:3 }}>▶</a>
                      )}
                      {!t.image_link && !t.video_link && <span className="dim" style={{ fontSize:11 }}>—</span>}
                    </td>

                    <td style={{ maxWidth:110 }}>
                      {(t.tags||[]).length > 0
                        ? <span style={{ fontSize:10, color:'var(--purple)', lineHeight:1.4 }}>{t.tags.join(', ')}</span>
                        : <span className="dim" style={{ fontSize:11 }}>—</span>}
                    </td>

                    {isOwner && (
                      <td style={{ whiteSpace:'nowrap' }}>
                        <button className="btn-icon" onClick={()=>onEdit(t)} title="Edit">✎</button>
                        <button className="btn-icon del" onClick={()=>handleDelete(t.id)}
                          style={{ marginLeft:3 }} title="Delete">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:12 }}>
          <button className="btn-ghost" style={{ padding:'6px 12px' }}
            disabled={page===1} onClick={()=>setPage(1)}>«</button>
          <button className="btn-ghost" style={{ padding:'6px 12px' }}
            disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹ Prev</button>
          <span style={{ fontSize:13, color:'var(--t2)', padding:'0 8px' }}>
            Page <strong style={{ color:'var(--text)' }}>{page}</strong> / {totalPages}
            <span style={{ color:'var(--t3)', marginLeft:8 }}>({allFiltered.length} total)</span>
          </span>
          <button className="btn-ghost" style={{ padding:'6px 12px' }}
            disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next ›</button>
          <button className="btn-ghost" style={{ padding:'6px 12px' }}
            disabled={page===totalPages} onClick={()=>setPage(totalPages)}>»</button>
        </div>
      )}

      <Lightbox src={lightbox} onClose={()=>setLightbox(null)} />
      <Confirm
        open={!!confirm}
        title={confirm?.title}
        msg={confirm?.msg}
        onYes={confirm?.isImport ? confirmImport : confirmDelete}
        onNo={()=>setConfirm(null)}
        danger={!confirm?.isImport}
      />
    </div>
  )
}