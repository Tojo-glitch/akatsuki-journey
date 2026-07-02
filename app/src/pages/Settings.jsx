import React, { useState, useEffect } from 'react'
import { changePin, savePairs, saveSetupTypes, saveBehaviorTags } from '../lib/api'

// ── Section wrapper ─────────────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 16, paddingBottom: 12,
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ── Tag list manager ─────────────────────────────────────────────
function TagManager({ items, onRemove, inputValue, onInputChange, onAdd, placeholder, colorStyle }) {
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, minHeight: 32 }}>
        {items.length === 0 && (
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>No items yet</span>
        )}
        {items.map(item => (
          <span key={item} className="stag" style={colorStyle}>
            {item}
            <span className="stag-x" onClick={() => onRemove(item)} title="Remove">✕</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
        />
        <button className="btn-ghost" onClick={onAdd}>+ Add</button>
      </div>
    </>
  )
}

// ── PIN Change section ───────────────────────────────────────────
function PINSection({ toast }) {
  const [pinOld, setPinOld]       = useState('')
  const [pinNew, setPinNew]       = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [loading, setLoading]     = useState(false)
  const [showPins, setShowPins]   = useState(false)

  const handleChange = async () => {
    // Client-side validation first
    if (!pinOld)    { toast('Enter your current PIN', 'error'); return }
    if (!pinNew)    { toast('Enter a new PIN', 'error'); return }
    if (!pinConfirm){ toast('Confirm your new PIN', 'error'); return }
    if (pinNew !== pinConfirm) { toast('New PINs do not match', 'error'); return }
    if (pinNew.length !== 6)   { toast('PIN must be exactly 6 digits', 'error'); return }
    if (!/^\d+$/.test(pinNew)) { toast('PIN must contain digits only', 'error'); return }
    if (pinOld === pinNew)     { toast('New PIN must be different from current', 'error'); return }

    setLoading(true)
    try {
      const res = await changePin(pinOld, pinNew)
      if (res?.success) {
        toast('PIN changed successfully ✓')
        setPinOld(''); setPinNew(''); setPinConfirm('')
        // Expire the cached PIN session so new PIN is required
        sessionStorage.removeItem('tj_pin_session')
      } else {
        toast(res?.message || 'Failed to change PIN — check your current PIN', 'error')
      }
    } catch (err) {
      toast(err.message || 'Connection error', 'error')
    }
    setLoading(false)
  }

  const inputType = showPins ? 'text' : 'password'

  return (
    <Section icon="🔐" title="Change PIN">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
        {[
          { label: 'Current PIN', val: pinOld, set: setPinOld },
          { label: 'New PIN (6 digits)', val: pinNew, set: setPinNew },
          { label: 'Confirm New PIN', val: pinConfirm, set: setPinConfirm },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label className="form-label" style={{ display: 'block', marginBottom: 5 }}>{label}</label>
            <input
              type={inputType}
              inputMode="numeric"
              maxLength={6}
              value={val}
              onChange={e => set(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              onKeyDown={e => e.key === 'Enter' && handleChange()}
            />
          </div>
        ))}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--t2)', cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={showPins} onChange={e => setShowPins(e.target.checked)} style={{ width: 'auto' }} />
          Show PIN digits
        </label>

        <button
          className="btn-primary"
          onClick={handleChange}
          disabled={loading}
          style={{ alignSelf: 'flex-start' }}>
          {loading ? '⏳ Changing…' : '🔑 Change PIN'}
        </button>
      </div>

      <div style={{
        marginTop: 16, padding: 12,
        background: 'rgba(38,217,160,.05)',
        border: '1px solid rgba(38,217,160,.15)',
        borderRadius: 8,
      }}>
        <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7, margin: 0 }}>
          🛡️ PIN is stored as a <strong style={{ color: 'var(--green)' }}>bcrypt hash</strong> in Supabase — never plain text.<br />
          After changing, you'll need to enter the new PIN on next action.
        </p>
      </div>
    </Section>
  )
}

// ── Main Settings page ───────────────────────────────────────────
export default function Settings({ config, setConfig, requirePin, toast }) {
  const [pairs,   setPairs]   = useState([...config.pairs])
  const [setups,  setSetups]  = useState([...config.setupTypes])
  const [btags,   setBtags]   = useState([...config.behaviorTags])
  const [newPair, setNewPair] = useState('')
  const [newSetup, setNewSetup] = useState('')
  const [newBtag, setNewBtag]  = useState('')
  const [saving, setSaving]    = useState({})

  // Keep local state in sync when config loads from DB
  useEffect(() => {
    setPairs([...config.pairs])
    setSetups([...config.setupTypes])
    setBtags([...config.behaviorTags])
  }, [config])

  const setSav = (key, val) => setSaving(s => ({ ...s, [key]: val }))

  const addItem = (list, setList, val, setVal) => {
    const v = val.trim()
    if (!v) return
    if (list.includes(v)) { toast(`"${v}" already exists`, 'error'); return }
    setList([...list, v])
    setVal('')
  }
  const removeItem = (list, setList, val) => setList(list.filter(x => x !== val))

  const doSavePairs = () => {
    if (pairs.length === 0) { toast('Add at least one pair', 'error'); return }
    requirePin(async pin => {
      setSav('pairs', true)
      const res = await savePairs(pin, pairs)
      setSav('pairs', false)
      if (res?.success) { toast('Pairs saved ✓'); setConfig(c => ({ ...c, pairs })) }
      else toast(res?.message || 'Error saving pairs', 'error')
    })
  }

  const doSaveSetups = () => {
    if (setups.length === 0) { toast('Add at least one setup type', 'error'); return }
    requirePin(async pin => {
      setSav('setups', true)
      const res = await saveSetupTypes(pin, setups)
      setSav('setups', false)
      if (res?.success) { toast('Setup types saved ✓'); setConfig(c => ({ ...c, setupTypes: setups })) }
      else toast(res?.message || 'Error saving setups', 'error')
    })
  }

  const doSaveBtags = () => {
    requirePin(async pin => {
      setSav('btags', true)
      const res = await saveBehaviorTags(pin, btags)
      setSav('btags', false)
      if (res?.success) { toast('Behavior tags saved ✓'); setConfig(c => ({ ...c, behaviorTags: btags })) }
      else toast(res?.message || 'Error saving tags', 'error')
    })
  }

  return (
    <div>
      <div className="page-title">Settings</div>
      <div className="page-sub">Manage your trade journal configuration</div>

      {/* PIN — full width, first */}
      <PINSection toast={toast} />

      {/* Two column on desktop, single on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>

        {/* Pairs */}
        <Section icon="📊" title="Currency Pairs">
          <TagManager
            items={pairs}
            onRemove={v => removeItem(pairs, setPairs, v)}
            inputValue={newPair}
            onInputChange={v => setNewPair(v.toUpperCase())}
            onAdd={() => addItem(pairs, setPairs, newPair, setNewPair)}
            placeholder="e.g. GBPJPY"
          />
          <button className="btn-primary" style={{ marginTop: 12 }}
            onClick={doSavePairs} disabled={saving.pairs}>
            {saving.pairs ? '⏳ Saving…' : '💾 Save Pairs'}
          </button>
        </Section>

        {/* Setup Types */}
        <Section icon="🎯" title="Setup Types">
          <TagManager
            items={setups}
            onRemove={v => removeItem(setups, setSetups, v)}
            inputValue={newSetup}
            onInputChange={setNewSetup}
            onAdd={() => addItem(setups, setSetups, newSetup, setNewSetup)}
            placeholder="e.g. Order Block"
          />
          <button className="btn-primary" style={{ marginTop: 12 }}
            onClick={doSaveSetups} disabled={saving.setups}>
            {saving.setups ? '⏳ Saving…' : '💾 Save Setups'}
          </button>
        </Section>

      </div>

      {/* Behavior Tags — full width */}
      <Section icon="🧠" title="Behavior Tags — track trading psychology">
        <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>
          Tag each trade with behavioral patterns to analyze what affects your performance.
        </p>
        <TagManager
          items={btags}
          onRemove={v => removeItem(btags, setBtags, v)}
          inputValue={newBtag}
          onInputChange={setNewBtag}
          onAdd={() => addItem(btags, setBtags, newBtag, setNewBtag)}
          placeholder="e.g. Impulsive Entry"
          colorStyle={{ borderColor: 'rgba(157,127,232,.3)', color: 'var(--purple)' }}
        />
        <button className="btn-primary" style={{ marginTop: 12 }}
          onClick={doSaveBtags} disabled={saving.btags}>
          {saving.btags ? '⏳ Saving…' : '💾 Save Tags'}
        </button>
      </Section>

      {/* System Info */}
      <Section icon="ℹ️" title="System Info">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {[
            ['Version',       'v3.0.0'],
            ['Database',      'Supabase (Postgres)'],
            ['Hosting',       'Cloudflare Pages'],
            ['Pairs',         config.pairs.length + ' configured'],
            ['Setup Types',   config.setupTypes.length + ' configured'],
            ['Behavior Tags', config.behaviorTags.length + ' configured'],
            ['PIN Security',  'bcrypt hashed'],
            ['PIN Session',   '15 min cache'],
          ].map(([k, v]) => (
            <div key={k} style={{
              background: 'var(--bg)', borderRadius: 8, padding: '10px 12px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{k}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}