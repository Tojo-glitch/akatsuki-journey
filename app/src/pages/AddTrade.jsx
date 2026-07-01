import React, { useState, useEffect, useCallback } from 'react'
import { addTrade, editTrade } from '../lib/api'

const TICK_DEFAULTS = { XAUUSD: 0.1, USDJPY: 0.01, BTCUSD: 1, ETHUSD: 1, default: 0.0001 }

function getSession(time) {
  if (!time) return ''
  const h = parseInt(time.split(':')[0])
  if (h >= 1 && h < 8) return 'Asia'
  if (h >= 8 && h < 16) return 'London'
  return 'New York'
}

function calcAuto(entry, target, sl, tick) {
  const e = parseFloat(entry), t = parseFloat(target), s = parseFloat(sl), tk = parseFloat(tick) || 0.0001
  if (!e || !s) return {}
  const dir = e > s ? 'Buy' : 'Sell'
  const slR = +((dir === 'Buy' ? e - s : s - e) / tk).toFixed(2)
  const tpR = t ? +((dir === 'Buy' ? t - e : e - t) / tk).toFixed(2) : null
  const rr = tpR && slR ? +(tpR / slR).toFixed(2) : null
  return { dir, slR, tpR, rr }
}

export default function AddTrade({ config, requirePin, toast, editData, onEditDone }) {
  const isEdit = !!editData
  const [form, setForm] = useState({
    pair: config.pairs[0] || 'XAUUSD',
    trade_date: new Date().toISOString().slice(0, 10),
    time_entry: '', time_out: '',
    direction: '', setup_type: config.setupTypes[0] || '',
    entry_price: '', target_price: '', stop_loss: '',
    tick_size: '',
    result: '', image_link: '', video_link: '', notes: '',
    tags: []
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editData) {
      setForm({
        pair: editData.pair || config.pairs[0],
        trade_date: editData.trade_date || new Date().toISOString().slice(0, 10),
        time_entry: editData.time_entry || '',
        time_out: editData.time_out || '',
        direction: editData.direction || '',
        setup_type: editData.setup_type || '',
        entry_price: editData.entry_price ?? '',
        target_price: editData.target_price ?? '',
        stop_loss: editData.stop_loss ?? '',
        tick_size: editData.tick_size ?? '',
        result: editData.result || '',
        image_link: editData.image_link || '',
        video_link: editData.video_link || '',
        notes: editData.notes || '',
        tags: editData.tags || []
      })
    }
  }, [editData])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const defaultTick = TICK_DEFAULTS[form.pair] ?? TICK_DEFAULTS.default
  const auto = calcAuto(form.entry_price, form.target_price, form.stop_loss, form.tick_size || defaultTick)
  const session = getSession(form.time_entry)

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
    }))
  }

  const handleSubmit = useCallback(() => {
    if (!form.trade_date || !form.entry_price || !form.stop_loss) {
      toast('Please fill Date, Entry, and Stop Loss', 'error'); return
    }
    if (!form.result) { toast('Please select a Result', 'error'); return }

    const data = {
      ...form,
      tick_size: parseFloat(form.tick_size) || defaultTick,
      entry_price: parseFloat(form.entry_price) || null,
      target_price: parseFloat(form.target_price) || null,
      stop_loss: parseFloat(form.stop_loss) || null,
    }

    requirePin(async (pin) => {
      setSaving(true)
      try {
        const res = isEdit
          ? await editTrade(pin, editData.id, data)
          : await addTrade(pin, data)

        if (res?.success) {
          toast(res.message || (isEdit ? 'Trade updated' : 'Trade added ✓'))
          if (isEdit) { onEditDone(); return }
          setForm(f => ({
            ...f, time_entry: '', time_out: '',
            direction: '', entry_price: '', target_price: '',
            stop_loss: '', result: '', image_link: '',
            video_link: '', notes: '', tags: []
          }))
        } else {
          toast(res?.message || 'Error saving trade', 'error')
        }
      } catch (e) { toast(e.message, 'error') }
      setSaving(false)
    })
  }, [form, isEdit, editData, requirePin, toast, onEditDone])

  const acColor = auto.dir === 'Buy' ? 'var(--green)' : auto.dir === 'Sell' ? 'var(--red)' : 'var(--t2)'

  return (
    <div>
      <div className="page-title">{isEdit ? 'Edit Trade' : 'Add Trade'}</div>
      <div className="page-sub">
        {isEdit ? `Editing: ${editData.pair} · ${editData.trade_date}` : 'Record a new trade'}
      </div>

      <div className="card">
        {/* Row 1: date, pair, times */}
        <div className="form-grid" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" value={form.trade_date} onChange={e => set('trade_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Pair</label>
            <select value={form.pair} onChange={e => set('pair', e.target.value)}>
              {config.pairs.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Entry Time</label>
            <input type="time" value={form.time_entry} onChange={e => set('time_entry', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">
              Exit Time &nbsp;
              {session && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11,
                  color: session === 'Asia' ? 'var(--purple)' : session === 'London' ? 'var(--blue)' : 'var(--yellow)' }}>
                  [{session}]
                </span>
              )}
            </label>
            <input type="time" value={form.time_out} onChange={e => set('time_out', e.target.value)} />
          </div>
        </div>

        {/* Direction */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Direction</label>
          <div className="dir-toggle">
            <button className={`dir-btn buy ${form.direction === 'Buy' ? 'active' : ''}`}
              onClick={() => set('direction', 'Buy')}>▲ BUY</button>
            <button className={`dir-btn sell ${form.direction === 'Sell' ? 'active' : ''}`}
              onClick={() => set('direction', 'Sell')}>▼ SELL</button>
          </div>
        </div>

        {/* Setup */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Setup Type</label>
          <select value={form.setup_type} onChange={e => set('setup_type', e.target.value)}>
            {config.setupTypes.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Prices */}
        <div className="form-grid3" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Entry Price</label>
            <input type="number" step="any" value={form.entry_price}
              onChange={e => set('entry_price', e.target.value)} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Target (TP)</label>
            <input type="number" step="any" value={form.target_price}
              onChange={e => set('target_price', e.target.value)} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Stop Loss</label>
            <input type="number" step="any" value={form.stop_loss}
              onChange={e => set('stop_loss', e.target.value)} placeholder="0.00" />
          </div>
        </div>

        {/* Tick size */}
        <div className="form-group" style={{ marginBottom: 12, maxWidth: 200 }}>
          <label className="form-label">Tick / Pip Size</label>
          <input type="number" step="any" value={form.tick_size}
            onChange={e => set('tick_size', e.target.value)}
            placeholder={`Default: ${defaultTick}`} />
          <div className="form-hint">XAU=0.1 · EUR/GBP=0.0001 · JPY=0.01 · BTC=1</div>
        </div>

        {/* Auto calc */}
        <div className="auto-calc" style={{ marginBottom: 12 }}>
          <div className="ac-item">
            <div className="ac-label">Auto Dir</div>
            <div className="ac-val" style={{ color: acColor }}>{auto.dir || '—'}</div>
          </div>
          <div className="ac-item">
            <div className="ac-label">TP (R)</div>
            <div className="ac-val" style={{ color: 'var(--green)' }}>{auto.tpR ?? '—'}</div>
          </div>
          <div className="ac-item">
            <div className="ac-label">SL (R)</div>
            <div className="ac-val" style={{ color: 'var(--red)' }}>{auto.slR ?? '—'}</div>
          </div>
          <div className="ac-item">
            <div className="ac-label">R:R</div>
            <div className="ac-val" style={{ color: 'var(--yellow)' }}>{auto.rr ? '1:' + auto.rr : '—'}</div>
          </div>
        </div>

        {/* Result */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Result</label>
          <div className="result-row">
            {['Win', 'Loss', 'Miss'].map(r => (
              <button key={r} className={`result-btn ${r.toLowerCase()} ${form.result === r ? 'active' : ''}`}
                onClick={() => set('result', r)}>
                {r === 'Win' ? '✓' : r === 'Loss' ? '✗' : '◌'} {r}
              </button>
            ))}
          </div>
        </div>

        {/* Behavior tags */}
        {config.behaviorTags?.length > 0 && (
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Behavior Tags</label>
            <div className="tag-pills">
              {config.behaviorTags.map(tag => (
                <button key={tag} className={`tag-pill ${form.tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}>{tag}</button>
              ))}
            </div>
          </div>
        )}

        {/* Media links */}
        <div className="form-grid" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">🖼 Image Link</label>
            <input type="url" value={form.image_link} onChange={e => set('image_link', e.target.value)}
              placeholder="https://…" />
          </div>
          <div className="form-group">
            <label className="form-label">▶ YouTube / Video Link</label>
            <input type="url" value={form.video_link} onChange={e => set('video_link', e.target.value)}
              placeholder="https://youtube.com/…" />
          </div>
        </div>

        {/* Notes */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Notes / Analysis</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Market context, entry reasoning, lessons learned…" />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {isEdit && <button className="btn-ghost" onClick={onEditDone}>Cancel</button>}
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? '✓ Save Changes' : '✚ Add Trade'}
          </button>
        </div>
      </div>
    </div>
  )
}