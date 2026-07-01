import React, { useState, useEffect } from 'react'
import { changePin, savePairs, saveSetupTypes, saveBehaviorTags } from '../lib/api'

export default function Settings({ config, setConfig, requirePin, toast }) {
  const [pairs, setPairs] = useState(config.pairs)
  const [setups, setSetups] = useState(config.setupTypes)
  const [btags, setBtags] = useState(config.behaviorTags)
  const [newPair, setNewPair] = useState('')
  const [newSetup, setNewSetup] = useState('')
  const [newBtag, setNewBtag] = useState('')
  const [pinOld, setPinOld] = useState('')
  const [pinNew, setPinNew] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')

  useEffect(() => {
    setPairs(config.pairs)
    setSetups(config.setupTypes)
    setBtags(config.behaviorTags)
  }, [config])

  const doSavePairs = () => {
    requirePin(async pin => {
      const res = await savePairs(pin, pairs)
      if (res?.success) { toast('Pairs saved'); setConfig(c => ({ ...c, pairs })) }
      else toast(res?.message || 'Error', 'error')
    })
  }

  const doSaveSetups = () => {
    requirePin(async pin => {
      const res = await saveSetupTypes(pin, setups)
      if (res?.success) { toast('Setup types saved'); setConfig(c => ({ ...c, setupTypes: setups })) }
      else toast(res?.message || 'Error', 'error')
    })
  }

  const doSaveBtags = () => {
    requirePin(async pin => {
      const res = await saveBehaviorTags(pin, btags)
      if (res?.success) { toast('Behavior tags saved'); setConfig(c => ({ ...c, behaviorTags: btags })) }
      else toast(res?.message || 'Error', 'error')
    })
  }

  const doChangePin = async () => {
    if (!pinOld || !pinNew || !pinConfirm) { toast('Fill all PIN fields', 'error'); return }
    if (pinNew !== pinConfirm) { toast('New PINs do not match', 'error'); return }
    if (pinNew.length !== 6 || !/^\d+$/.test(pinNew)) { toast('PIN must be exactly 6 digits', 'error'); return }
    const res = await changePin(pinOld, pinNew)
    if (res?.success) {
      toast('PIN changed successfully')
      setPinOld(''); setPinNew(''); setPinConfirm('')
      // Clear cached session so new PIN is required next time
      sessionStorage.removeItem('tj_pin_session')
    } else toast(res?.message || 'Error', 'error')
  }

  const addItem = (list, setList, val, setVal) => {
    const v = val.trim()
    if (v && !list.includes(v)) { setList([...list, v]); setVal('') }
  }
  const removeItem = (list, setList, val) => setList(list.filter(x => x !== val))

  return (
    <div>
      <div className="page-title">Settings</div>
      <div className="page-sub">All changes require PIN verification</div>

      <div className="settings-grid">
        {/* Change PIN */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 14 }}>
            🔐 Change PIN (6 digits)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Current PIN', val: pinOld, set: setPinOld },
              { label: 'New PIN', val: pinNew, set: setPinNew },
              { label: 'Confirm New PIN', val: pinConfirm, set: setPinConfirm },
            ].map(({ label, val, set }) => (
              <div className="form-group" key={label}>
                <label className="form-label">{label}</label>
                <input type="password" inputMode="numeric" maxLength={6}
                  value={val} onChange={e => set(e.target.value)} placeholder="••••••" />
              </div>
            ))}
            <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={doChangePin}>
              Change PIN
            </button>
          </div>

          <div style={{ marginTop: 20, padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
              🛡️ PIN is stored as a bcrypt hash in Supabase — not plain text.<br />
              A verified PIN is remembered for 15 minutes per browser session.
            </p>
          </div>
        </div>

        {/* System info */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 14 }}>
            ℹ️ System Info
          </div>
          {[
            ['Version', 'v3.0.0'],
            ['Database', 'Supabase (Postgres)'],
            ['Hosting', 'Cloudflare Pages'],
            ['Pairs', config.pairs.length],
            ['Setup Types', config.setupTypes.length],
            ['Behavior Tags', config.behaviorTags.length],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--t2)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Pairs */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
            📊 Currency Pairs
          </div>
          <div className="stag-list">
            {pairs.map(p => (
              <span key={p} className="stag">{p}
                <span className="stag-x" onClick={() => removeItem(pairs, setPairs, p)}>✕</span>
              </span>
            ))}
          </div>
          <div className="add-row" style={{ marginBottom: 12 }}>
            <input value={newPair} onChange={e => setNewPair(e.target.value.toUpperCase())}
              placeholder="e.g. GBPJPY" maxLength={12}
              onKeyDown={e => e.key === 'Enter' && addItem(pairs, setPairs, newPair, setNewPair)} />
            <button className="btn-ghost" onClick={() => addItem(pairs, setPairs, newPair, setNewPair)}>+ Add</button>
          </div>
          <button className="btn-primary" onClick={doSavePairs}>💾 Save Pairs</button>
        </div>

        {/* Setup types */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
            🎯 Setup Types
          </div>
          <div className="stag-list">
            {setups.map(s => (
              <span key={s} className="stag">{s}
                <span className="stag-x" onClick={() => removeItem(setups, setSetups, s)}>✕</span>
              </span>
            ))}
          </div>
          <div className="add-row" style={{ marginBottom: 12 }}>
            <input value={newSetup} onChange={e => setNewSetup(e.target.value)}
              placeholder="e.g. Order Block"
              onKeyDown={e => e.key === 'Enter' && addItem(setups, setSetups, newSetup, setNewSetup)} />
            <button className="btn-ghost" onClick={() => addItem(setups, setSetups, newSetup, setNewSetup)}>+ Add</button>
          </div>
          <button className="btn-primary" onClick={doSaveSetups}>💾 Save Setups</button>
        </div>

        {/* Behavior tags */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
            🧠 Behavior Tags — track your trading psychology
          </div>
          <div className="stag-list">
            {btags.map(t => (
              <span key={t} className="stag" style={{ borderColor: 'rgba(157,127,232,.3)', color: 'var(--purple)' }}>
                {t}
                <span className="stag-x" onClick={() => removeItem(btags, setBtags, t)}>✕</span>
              </span>
            ))}
          </div>
          <div className="add-row" style={{ marginBottom: 12, maxWidth: 400 }}>
            <input value={newBtag} onChange={e => setNewBtag(e.target.value)}
              placeholder="e.g. Impulsive Entry"
              onKeyDown={e => e.key === 'Enter' && addItem(btags, setBtags, newBtag, setNewBtag)} />
            <button className="btn-ghost" onClick={() => addItem(btags, setBtags, newBtag, setNewBtag)}>+ Add</button>
          </div>
          <button className="btn-primary" onClick={doSaveBtags}>💾 Save Tags</button>
        </div>
      </div>
    </div>
  )
}