import React, { useState, useEffect } from 'react'
import { changePin, savePairs, saveSetupTypes, saveBehaviorTags, getAccessFootprint, deleteTradesByPair, exportAllTrades, getStaleActiveTrades, quickUpdateResult } from '../lib/api'

const fmtDt = s => new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function TagManager({ items, onRemove, inputValue, onInputChange, onAdd, placeholder, colorStyle }) {
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, minHeight: 32 }}>
        {items.length === 0 && <span style={{ fontSize: 12, color: 'var(--t3)' }}>No configurations found</span>}
        {items.map(item => (
          <span key={item} className="stag" style={colorStyle}>
            {item}
            <span className="stag-x" onClick={() => onRemove(item)}>✕</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={inputValue} onChange={e => onInputChange(e.target.value)}
          placeholder={placeholder} style={{ flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && onAdd()} />
        <button className="btn-ghost" onClick={onAdd}>+ Add</button>
      </div>
    </>
  )
}

function PINSection({ toast, onLock }) {
  const [old, setOld] = useState('')
  const [nw, setNw] = useState('')
  const [cf, setCf] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!old)       { toast('Enter current PIN', 'error'); return }
    if (!nw)        { toast('Enter new PIN', 'error'); return }
    if (!cf)        { toast('Confirm new PIN', 'error'); return }
    if (nw !== cf)  { toast('New PINs do not match', 'error'); return }
    if (nw.length !== 6) { toast('PIN must be exactly 6 digits', 'error'); return }
    if (!/^\d+$/.test(nw)) { toast('Digits only', 'error'); return }
    if (old === nw) { toast('New PIN must differ from current', 'error'); return }
    
    setLoading(true)
    try {
      const res = await changePin(sessionStorage.getItem('tj_owner_token'), old, nw)
      if (res?.success) {
        toast('PIN changed ✓')
        setOld(''); setNw(''); setCf('')
        if (onLock) onLock()
      } else {
        toast(res?.message || 'Failed — check current PIN', 'error')
      }
    } catch (e) { 
      toast(e.message || 'Error', 'error') 
    }
    setLoading(false)
  }

  const t = show ? 'text' : 'password'
  return (
    <Section title="Change Security PIN">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300 }}>
        {[['Current PIN', old, setOld], ['New PIN (6 digits)', nw, setNw], ['Confirm New PIN', cf, setCf]].map(([lbl, val, set]) => (
          <div key={lbl}>
            <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>{lbl}</label>
            <input type={t} inputMode="numeric" maxLength={6} value={val}
              onChange={e => set(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••" onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} style={{ width: 'auto' }} />
          Show digits
        </label>
        <button className="btn-primary" onClick={handle} disabled={loading} style={{ alignSelf: 'flex-start' }}>
          {loading ? 'Changing…' : 'Change PIN'}
        </button>
      </div>
    </Section>
  )
}

function DataSection({ config, requirePin, toast }) {
  const [delPair, setDelPair] = useState(config.pairs[0] || '')
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const handleExport = () => {
    requirePin(async pin => {
      setLoading(true)
      try {
        const res = await exportAllTrades(sessionStorage.getItem('tj_owner_token'))
        if (res?.success) {
          const json = JSON.stringify(res.data, null, 2)
          const blob = new Blob([json], { type:'application/json' })
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `tradelog_backup_${new Date().toISOString().slice(0, 10)}.json`
          a.click()
          toast(`Exported ${res.data.length} trades`)
        } else {
          toast(res?.message || 'Export failed', 'error')
        }
      } catch (e) { 
        toast(e.message, 'error') 
      }
      setLoading(false)
    })
  }

  const handleDeletePair = () => {
    if (!delPair) return
    setConfirm({ pair: delPair })
  }

  const doDelete = () => {
    const pair = confirm.pair
    setConfirm(null)
    requirePin(async pin => {
      setLoading(true)
      try {
        const res = await deleteTradesByPair(sessionStorage.getItem('tj_owner_token'), pair)
        if (res?.success) {
          toast(res.message || 'Deleted')
        } else {
          toast(res?.message || 'Error', 'error')
        }
      } catch (e) { 
        toast(e.message, 'error') 
      }
      setLoading(false)
    })
  }

  return (
    <Section title="Data Management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', color: 'var(--t2)' }}>Export Full Backup</div>
          <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
            Download all trade configurations as JSON files to serve as disaster recovery.
          </p>
          <button className="btn-ghost" onClick={handleExport} disabled={loading}>
            {loading ? 'Exporting…' : 'Download JSON Backup'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', color: 'var(--red)' }}>Delete All Records for Currency Pair</div>
          <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
            Permanently clear all historical logs for the specified asset. This is permanent.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={delPair} onChange={e => setDelPair(e.target.value)} style={{ maxWidth: 160 }}>
              {config.pairs.map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="btn-danger" onClick={handleDeletePair} disabled={loading}>
              Delete All {delPair} Trades
            </button>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Delete All {confirm.pair} Trades?</h3>
            <p style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              This will permanently remove all logs for {confirm.pair}.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={doDelete}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}

function SecurityTrailSection({ requirePin, toast }) {
  const [logs, setLogs] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadLogs = () => {
    requirePin(async pin => {
      setLoading(true)
      const res = await getAccessFootprint(sessionStorage.getItem('tj_owner_token'), 60)
      if (res?.success) {
        setLogs(res.data || [])
      } else {
        toast(res?.message || 'Error', 'error')
      }
      setLoading(false)
    })
  }

  const badgeType = type => type === 'VIEW_PAGE' ? 'badge-buy' : 'badge-sell'
  const actionColor = act => {
    if (act.includes('success')) return 'add'
    if (act.includes('failed') || act.includes('lockout')) return 'delete'
    return 'edit'
  }

  return (
    <Section title="Access Ledger & Security Trail">
      {!logs ? (
        <button className="btn-ghost" onClick={loadLogs} disabled={loading}>
          {loading ? 'Accessing Secure Pipeline…' : 'Unlock Footprint Trail (PIN Required)'}
        </button>
      ) : logs.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--t3)' }}>No activity logged.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>IP Address</th>
                <th>Event Type</th>
                <th>Action details</th>
                <th>Target Scope</th>
                <th>Session ID Reference</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i}>
                  <td className="mono dim" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDt(l.event_time)}</td>
                  <td className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{l.client_ip || '127.0.0.1'}</td>
                  <td>
                    <span className={`badge ${badgeType(l.type)}`} style={{ fontSize: 9 }}>{l.type}</span>
                  </td>
                  <td>
                    <span className={`audit-action ${actionColor(l.action)}`}>{l.action}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)' }}>{l.target}</td>
                  <td className="mono dim" style={{ fontSize: 10, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.session_id}>
                    {l.session_id || 'untracked'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

// ── 🌟 [ยกระดับ DATA HYGIENE]: บอร์ดแผงตรวจรอยสิวสถิติลืมปิดดีล ──
function DataHygieneSection({ requirePin, toast }) {
  const [staleTrades, setStaleTrades] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadStale = () => {
    requirePin(async pin => {
      setLoading(true)
      const res = await getStaleActiveTrades(sessionStorage.getItem('tj_owner_token'))
      if (res?.success) setStaleTrades(res.data)
      setLoading(false)
    })
  }

  const handleResolveStale = async (tradeId, outcome) => {
    const ownerToken = sessionStorage.getItem('tj_owner_token')
    const res = await quickUpdateResult(ownerToken, tradeId, outcome)
    if (res?.success) {
      toast('Trade outcome updated successfully!')
      // โหลดสแกนข้อมูลสุขอนามัยใหม่หลังปิดสถานะเสร็จ
      const reRes = await getStaleActiveTrades(ownerToken)
      if (reRes?.success) setStaleTrades(reRes.data)
    } else {
      toast('Failed to resolve outcome', 'error')
    }
  }

  return (
    <Section title="Database Health & Hygiene Analyzer">
      {!staleTrades ? (
        <button className="btn-ghost" onClick={loadStale} disabled={loading}>
          {loading ? 'Analyzing Records…' : 'Scan Abandoned Open Trades (PIN Required)'}
        </button>
      ) : staleTrades.length === 0 ? (
        <div style={{ color: 'var(--green)', fontSize: 12, fontWeight: 700 }}>
          Perfect Database Hygiene! All logged trades successfully evaluated and closed.
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, marginBottom: 12 }}>
            WARNING: Found {staleTrades.length} abandoned positions older than 7 days. Keeping these open degrades overall statistical expectancy accuracy. Please close them below:
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pair</th>
                  <th>Dir</th>
                  <th>Entry</th>
                  <th>Quick Close Option</th>
                </tr>
              </thead>
              <tbody>
                {staleTrades.map(t => (
                  <tr key={t.id}>
                    <td className="mono dim" style={{ fontSize: 11 }}>{t.trade_date}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{t.pair}</td>
                    <td>{t.direction}</td>
                    <td className="mono">{t.entry_price}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['Win', 'Loss', 'Miss'].map(outcome => (
                          <button 
                            key={outcome}
                            onClick={() => handleResolveStale(t.id, outcome)}
                            className="btn-ghost" 
                            style={{ padding: '3px 8px', fontSize: 10, fontWeight: 700 }}
                          >
                            {outcome.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  )
}

export default function Settings({ config, setConfig, requirePin, toast, onLock }) {
  const [pairs, setPairs] = useState([...config.pairs])
  const [setups, setSetups] = useState([...config.setupTypes])
  const [btags, setBtags] = useState([...config.behaviorTags])
  const [newPair, setNewPair] = useState('')
  const [newSetup, setNewSetup] = useState('')
  const [newBtag,  setNewBtag]  = useState('')
  const [saving, setSaving] = useState({})

  useEffect(() => { 
    setPairs([...config.pairs])
    setSetups([...config.setupTypes])
    setBtags([...config.behaviorTags]) 
  }, [config])

  const setSav = (k, v) => setSaving(s => ({ ...s, [k]: v }))
  
  const addItem = (list, setList, val, setVal) => {
    const v = val.trim()
    if (!v) return
    if (list.includes(v)) { 
      toast(`"${v}" already exists`, 'error')
      return 
    }
    setList([...list, v])
    setVal('')
  }
  
  const removeItem = (list, setList, val) => setList(list.filter(x => x !== val))
  
  const doSave = (key, list, rpcFn, cfgKey) => {
    if (list.length === 0) { 
      toast(`Add at least one ${key}`, 'error')
      return 
    }
    requirePin(async pin => {
      setSav(key, true)
      const res = await rpcFn(sessionStorage.getItem('tj_owner_token'), list)
      setSav(key, false)
      if (res?.success) {
        toast(`${key} saved ✓`)
        setConfig(c => ({ ...c, [cfgKey]: list }))
      } else {
        toast(res?.message || `Error saving ${key}`, 'error')
      }
    })
  }

  return (
    <div>
      <div className="page-title">Settings</div>
      <div className="page-sub">All changes require PIN Verification</div>

      <PINSection toast={toast} onLock={onLock} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <Section title="Asset Classes & Pairs">
          <TagManager items={pairs} onRemove={v => removeItem(pairs, setPairs, v)}
            inputValue={newPair} onInputChange={v => setNewPair(v.toUpperCase())}
            onAdd={() => addItem(pairs, setPairs, newPair, setNewPair)} placeholder="e.g. GBPJPY" />
          <button className="btn-primary" style={{ marginTop: 12 }} disabled={saving.pairs}
            onClick={() => doSave('pairs', pairs, savePairs, 'pairs')}>
            {saving.pairs ? 'Saving…' : 'Save Configurations'}
          </button>
        </Section>

        <Section title="Strategy Setups">
          <TagManager items={setups} onRemove={v => removeItem(setups, setSetups, v)}
            inputValue={newSetup} onInputChange={setNewSetup}
            onAdd={() => addItem(setups, setSetups, newSetup, setNewSetup)} placeholder="e.g. FVG" />
          <button className="btn-primary" style={{ marginTop: 12 }} disabled={saving.setups}
            onClick={() => doSave('setups', setups, saveSetupTypes, 'setupTypes')}>
            {saving.setups ? 'Saving…' : 'Save Setups'}
          </button>
        </Section>
      </div>

      <Section title="Behavior Analysis Tags">
        <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>Tag psychological and emotional triggers to isolate metrics.</p>
        <TagManager items={btags} onRemove={v => removeItem(btags, setBtags, v)}
          inputValue={newBtag} onInputChange={setNewBtag}
          onAdd={() => addItem(btags, setBtags, newBtag, setNewBtag)} placeholder="e.g. FOMO"
          colorStyle={{ borderColor: 'rgba(157,127,232,.2)', color: 'var(--purple)' }} />
        <button className="btn-primary" style={{ marginTop: 12 }} disabled={saving.btags}
          onClick={() => doSave('btags', btags, saveBehaviorTags, 'behaviorTags')}>
          {saving.btags ? 'Saving…' : 'Save Tags'}
        </button>
      </Section>

      <DataSection config={config} requirePin={requirePin} toast={toast} />
      
      {/* ── 🌟 [ยกระดับ DATA HYGIENE]: สแกนลบดีลที่ลืมปิดออเดอร์ในหน้าต่างเดียวจบ ── */}
      <DataHygieneSection requirePin={requirePin} toast={toast} />

      <SecurityTrailSection requirePin={requirePin} toast={toast} />

      <Section title="System Information">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          {[
            ['Version', 'v3.0.0'], ['Database Engine', 'Supabase (Postgres)'],
            ['Host Instance', 'Cloudflare Pages'], ['Encryption Protocol', 'bcrypt'],
            ['Session Cache', 'sessionStorage (15m)'], ['Configured Assets', config.pairs.length],
            ['Configured Setups', config.setupTypes.length],
            ['Configured Tags', config.behaviorTags.length],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--bg)', borderRadius: 4, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{k}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}