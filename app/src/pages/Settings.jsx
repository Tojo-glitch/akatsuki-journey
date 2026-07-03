import React, { useState, useEffect } from 'react'
import { changePin, savePairs, saveSetupTypes, saveBehaviorTags, getAuditLog, getVisitorStats } from '../lib/api'

function Section({ icon, title, children }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        paddingBottom: 12, borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function TagManager({ items, onRemove, inputValue, onInputChange, onAdd, placeholder, colorStyle }) {
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, minHeight: 32 }}>
        {items.length === 0 && <span style={{ fontSize: 12, color: 'var(--t3)' }}>No items yet</span>}
        {items.map(item => (
          <span key={item} className="stag" style={colorStyle}>
            {item}
            <span className="stag-x" onClick={() => onRemove(item)} title="Remove">✕</span>
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

function PINSection({ toast }) {
  const [old, setOld]     = useState('')
  const [nw,  setNw]      = useState('')
  const [cf,  setCf]      = useState('')
  const [show, setShow]   = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!old) { toast('Enter current PIN', 'error'); return }
    if (!nw)  { toast('Enter new PIN', 'error'); return }
    if (!cf)  { toast('Confirm new PIN', 'error'); return }
    if (nw !== cf) { toast('New PINs do not match', 'error'); return }
    if (nw.length !== 6) { toast('PIN must be exactly 6 digits', 'error'); return }
    if (!/^\d+$/.test(nw)) { toast('Digits only', 'error'); return }
    if (old === nw) { toast('New PIN must differ from current', 'error'); return }

    setLoading(true)
    try {
      const res = await changePin(old, nw)
      if (res?.success) {
        toast('PIN changed ✓')
        setOld(''); setNw(''); setCf('')
        sessionStorage.removeItem('tj_owner_session')
      } else {
        toast(res?.message || 'Failed — check current PIN', 'error')
      }
    } catch (e) { toast(e.message || 'Error', 'error') }
    setLoading(false)
  }

  const t = show ? 'text' : 'password'
  return (
    <Section icon="🔐" title="Change PIN">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300 }}>
        {[['Current PIN', old, setOld], ['New PIN (6 digits)', nw, setNw], ['Confirm New PIN', cf, setCf]].map(([lbl, val, set]) => (
          <div key={lbl}>
            <label className="form-label" style={{ display: 'block', marginBottom: 5 }}>{lbl}</label>
            <input type={t} inputMode="numeric" maxLength={6} value={val}
              onChange={e => set(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••" onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--t2)', cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} style={{ width: 'auto' }} />
          Show digits
        </label>
        <button className="btn-primary" onClick={handle} disabled={loading} style={{ alignSelf: 'flex-start' }}>
          {loading ? '⏳ Changing…' : '🔑 Change PIN'}
        </button>
      </div>
      <div style={{ marginTop: 14, padding: 12, background: 'rgba(38,217,160,.05)', border: '1px solid rgba(38,217,160,.15)', borderRadius: 8 }}>
        <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7, margin: 0 }}>
          🛡️ Stored as <strong style={{ color: 'var(--green)' }}>bcrypt hash</strong> — never plain text.
          Changing PIN expires your current session immediately.
        </p>
      </div>
    </Section>
  )
}

function AuditSection({ requirePin, toast }) {
  const [logs, setLogs]     = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => {
    requirePin(async pin => {
      setLoading(true)
      const res = await getAuditLog(pin, 30)
      if (res?.success) setLogs(res.data || [])
      else toast(res?.message || 'Error', 'error')
      setLoading(false)
    })
  }

  const actionColor = a => a.includes('add') ? 'add' : a.includes('delete') ? 'delete' : 'edit'
  const fmtDt = s => new Date(s).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })

  return (
    <Section icon="📋" title="Activity Log">
      {!logs ? (
        <button className="btn-ghost" onClick={load} disabled={loading}>
          {loading ? '⏳ Loading…' : '🔓 Load Activity Log (PIN required)'}
        </button>
      ) : logs.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--t2)' }}>No activity yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Action</th><th>Pair</th><th>Details</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="mono dim" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDt(l.created_at)}</td>
                  <td><span className={`audit-action ${actionColor(l.action)}`}>{l.action}</span></td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{l.target_pair || '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--t2)' }}>
                    {l.details ? Object.entries(l.details).map(([k,v]) => `${k}: ${v}`).join(', ') : '—'}
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

function VisitorSection({ requirePin, toast }) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => {
    requirePin(async pin => {
      setLoading(true)
      const res = await getVisitorStats(pin)
      if (res?.success) setStats(res)
      else toast(res?.message || 'Error', 'error')
      setLoading(false)
    })
  }

  return (
    <Section icon="👁️" title="Visitor Analytics">
      {!stats ? (
        <button className="btn-ghost" onClick={load} disabled={loading}>
          {loading ? '⏳ Loading…' : '🔓 Load Stats (PIN required)'}
        </button>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8, marginBottom: 14 }}>
            {[['Today', stats.today], ['This Week', stats.week], ['This Month', stats.month], ['All Time', stats.total]].map(([lbl, val]) => (
              <div key={lbl} className="vis-stat">
                <div className="vis-stat-val">{val ?? 0}</div>
                <div className="vis-stat-lbl">{lbl}</div>
              </div>
            ))}
          </div>
          {stats.by_page?.length > 0 && (
            <table style={{ width: '100%', fontSize: 12 }}>
              <thead><tr><th>Page</th><th>Views (30d)</th></tr></thead>
              <tbody>
                {stats.by_page.map(p => (
                  <tr key={p.page}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--t2)' }}>{p.page}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>{p.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10 }}>
        Anonymous page views only — no personal data collected.
      </p>
    </Section>
  )
}

export default function Settings({ config, setConfig, requirePin, toast }) {
const [pairs,    setPairs]    = useState([...(config?.pairs || [])])
const [setups,   setSetups]   = useState([...(config?.setupTypes || [])])
const [btags,    setBtags]    = useState([...(config?.behaviorTags || [])])
  const [newPair,  setNewPair]  = useState('')
  const [newSetup, setNewSetup] = useState('')
  const [newBtag,  setNewBtag]  = useState('')
  const [saving,   setSaving]   = useState({})

  useEffect(() => {
    setPairs([...config.pairs])
    setSetups([...config.setupTypes])
    setBtags([...config.behaviorTags])
  }, [config])

  const setSav = (k, v) => setSaving(s => ({ ...s, [k]: v }))
  const addItem    = (list, setList, val, setVal) => {
    const v = val.trim()
    if (!v) return
    if (list.includes(v)) { toast(`"${v}" already exists`, 'error'); return }
    setList([...list, v]); setVal('')
  }
  const removeItem = (list, setList, val) => setList(list.filter(x => x !== val))

  const doSave = (key, list, rpcFn, configKey) => {
    if (list.length === 0) { toast(`Add at least one ${key}`, 'error'); return }
    requirePin(async pin => {
      setSav(key, true)
      const res = await rpcFn(pin, list)
      setSav(key, false)
      if (res?.success) { toast(`${key} saved ✓`); setConfig(c => ({ ...c, [configKey]: list })) }
      else toast(res?.message || `Error saving ${key}`, 'error')
    })
  }

  return (
    <div>
      <div className="page-title">Settings</div>
      <div className="page-sub">All changes require PIN · Session active for 15 min</div>

      <PINSection toast={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <Section icon="📊" title="Currency Pairs">
          <TagManager items={pairs} onRemove={v => removeItem(pairs, setPairs, v)}
            inputValue={newPair} onInputChange={v => setNewPair(v.toUpperCase())}
            onAdd={() => addItem(pairs, setPairs, newPair, setNewPair)} placeholder="e.g. GBPJPY" />
          <button className="btn-primary" style={{ marginTop: 12 }} disabled={saving.pairs}
            onClick={() => doSave('pairs', pairs, savePairs, 'pairs')}>
            {saving.pairs ? '⏳ Saving…' : '💾 Save Pairs'}
          </button>
        </Section>

        <Section icon="🎯" title="Setup Types">
          <TagManager items={setups} onRemove={v => removeItem(setups, setSetups, v)}
            inputValue={newSetup} onInputChange={setNewSetup}
            onAdd={() => addItem(setups, setSetups, newSetup, setNewSetup)} placeholder="e.g. Order Block" />
          <button className="btn-primary" style={{ marginTop: 12 }} disabled={saving.setups}
            onClick={() => doSave('setups', setups, saveSetupTypes, 'setupTypes')}>
            {saving.setups ? '⏳ Saving…' : '💾 Save Setups'}
          </button>
        </Section>
      </div>

      <Section icon="🧠" title="Behavior Tags — track trading psychology">
        <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>
          Tag trades with behavioral patterns to find what affects your performance.
        </p>
        <TagManager items={btags} onRemove={v => removeItem(btags, setBtags, v)}
          inputValue={newBtag} onInputChange={setNewBtag}
          onAdd={() => addItem(btags, setBtags, newBtag, setNewBtag)} placeholder="e.g. Impulsive Entry"
          colorStyle={{ borderColor: 'rgba(157,127,232,.3)', color: 'var(--purple)' }} />
        <button className="btn-primary" style={{ marginTop: 12 }} disabled={saving.btags}
          onClick={() => doSave('btags', btags, saveBehaviorTags, 'behaviorTags')}>
          {saving.btags ? '⏳ Saving…' : '💾 Save Tags'}
        </button>
      </Section>

      {/* Visitor analytics — Phase 3 */}
      <VisitorSection requirePin={requirePin} toast={toast} />

      {/* Activity log — Phase 2B */}
      <AuditSection requirePin={requirePin} toast={toast} />

      <Section icon="ℹ️" title="System Info">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          {[
            ['Version', 'v3.0.0'], ['Database', 'Supabase (Postgres)'],
            ['Hosting', 'Cloudflare Pages'], ['PIN Security', 'bcrypt hashed'],
            ['PIN Session', '15 min'], ['Pairs', (config?.pairs?.length || 0) + ' configured'],
            ['Setup Types', (config?.setupTypes?.length || 0) + ' configured'],
            ['Behavior Tags', (config?.behaviorTags?.length || 0) + ' configured'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{k}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}