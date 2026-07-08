import React, { useState, useEffect, useMemo } from 'react'
import { useTradeForm } from '../hooks/useTradeForm'
import { uploadChartImage, analyzeChartImage } from '../lib/api'
import { supabase } from '../lib/supabase'

function Err({ msg }) {
  return msg ? <span style={{ fontSize: 11, color: 'var(--red)', marginTop: 2, display: 'block', fontWeight: 600 }}>{msg}</span> : null
}

export default function AddTrade({ config, requirePin, toast, editData, onEditDone }) {
  const [isProfessional, setIsProfessional] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiPrefilledFields, setAiPrefilledFields] = useState([])

  // ── 🌟 แผงสถิติสำหรับใช้งานด้านการจับตาพฤติกรรม (Guardrails database) ──
  const [historyExpectancyMatrix, setHistoryExpectancyMatrix] = useState([])

  useEffect(() => {
    // โหลดประวัติจุดพังของพอร์ตสะสมขึ้นมาเตรียมสแกนภัย
    supabase.from('v_multi_dim_expectancy').select('*')
      .then(res => setHistoryExpectancyMatrix(res?.data || []))
      .catch(() => {})
  }, [])

  const {
    form,
    errors,
    saving,
    isEdit,
    defTick,
    set,
    auto,
    session,
    toggleTag,
    handleSubmit
  } = useTradeForm({ config, requirePin, toast, editData, onEditDone })

  // ── 🌟 SMART GUARDRAILS: ระบบเซนเซอร์ตรวจจับภัยสดเรียลไทม์ ──
  const activeGuardrailWarning = useMemo(() => {
    if (!form.pair || !form.trade_date) return null
    
    // แปลงวันที่หน้าแอปเป็นชื่อวันจันทร์-อาทิตย์ เพื่อนำมาเทียบข้อมูล View หลังบ้าน
    const daysNameList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const parsedDayName = daysNameList[new Date(form.trade_date).getDay()]

    // ทำการกรองสถิติย้อนหลังว่าเคยมีสถิติที่ขาดทุนเฉลี่ยติดลบในคอมโบนี้หรือไม่
    const matchingLeak = historyExpectancyMatrix.find(x => 
      x.pair === form.pair && 
      x.day_name === parsedDayName && 
      (session ? x.session === session : true) &&
      parseFloat(x.expectancy_r) < 0
    )

    if (matchingLeak) {
      return {
        expectancy: matchingLeak.expectancy_r,
        sample: matchingLeak.total_trades,
        day: matchingLeak.day_name,
        session: matchingLeak.session
      }
    }
    return null
  }, [form.pair, form.trade_date, session, historyExpectancyMatrix])

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadChartImage(file)
      if (res.success && res.url) {
        set('image_link', res.url)
        toast('Chart image stored successfully')
        triggerAiAnalysis(res.url)
      } else {
        toast(res.message || 'Storage upload failed', 'error')
      }
    } catch (e) {
      toast('Upload pipeline error', 'error')
    }
    setUploading(false)
  }

  const triggerAiAnalysis = async (url) => {
    setAiAnalyzing(true)
    toast('AI is analyzing chart parameters...')
    try {
      const res = await analyzeChartImage(url)
      if (res.success && res.data) {
        const ai = res.data
        const prefilledList = []

        if (ai.pair) { set('pair', ai.pair); prefilledList.push('pair'); }
        if (ai.direction) { set('direction', ai.direction); prefilledList.push('direction'); }
        if (ai.entry_price) { set('entry_price', ai.entry_price); prefilledList.push('entry_price'); }
        if (ai.stop_loss) { set('stop_loss', ai.stop_loss); prefilledList.push('stop_loss'); }
        if (ai.target_price) { set('target_price', ai.target_price); prefilledList.push('target_price'); }

        setAiPrefilledFields(prefilledList)
        toast('Parameters extracted from chart!')
      } else {
        toast('AI extraction failed, fallback to manual inputs')
      }
    } catch (err) {
      console.error(err)
    }
    setAiAnalyzing(false)
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        handleFileUpload(file)
        e.preventDefault()
        break
      }
    }
  }

  const acColor = auto.dir === 'Buy' ? 'var(--green)' : auto.dir === 'Sell' ? 'var(--red)' : 'var(--t2)'
  const aiHighlightStyle = (fieldName) => aiPrefilledFields.includes(fieldName) ? { borderColor: 'var(--yellow)', boxShadow: '0 0 0 2px rgba(255, 200, 87, 0.15)', transition: 'all 0.3s ease' } : {}

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="page-title">{isEdit ? 'Modify Record' : 'Log Trade'}</div>
          <div className="page-sub">{isEdit ? `Editing entry: ${editData.pair}` : 'Record a new trade execution'}</div>
        </div>

        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          {[
            [false, 'Standard Mode'],
            [true, 'Professional Mode']
          ].map(([mode, label]) => (
            <button key={String(mode)}
              onClick={() => setIsProfessional(mode)}
              style={{
                background: isProfessional === mode ? 'var(--card2)' : 'transparent',
                color: isProfessional === mode ? 'var(--green)' : 'var(--t2)',
                border: 'none', padding: '6px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer'
              }}>
              {label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── 🌟 ALERT: แถบแจ้งเตือนภัยสดระดับสากลก่อนฝ่าฝืนสถิติตัวเอง ── */}
      {activeGuardrailWarning && (
        <div style={{
          background: 'rgba(255, 92, 122, 0.04)', border: '1px dashed var(--red)',
          color: 'var(--red)', padding: '12px 16px', borderRadius: 4, marginBottom: 14,
          fontSize: 12, fontWeight: 700, letterSpacing: '0.01em', lineHeight: 1.6
        }}>
          Expectancy Warning: Statistically, executing {activeGuardrailWarning.pair} during {activeGuardrailWarning.session} on {activeGuardrailWarning.day}s yields a negative expectancy of {activeGuardrailWarning.expectancy}R (across {activeGuardrailWarning.sample} previous trades). Consider reviewing entry parameters.
        </div>
      )}

      {aiPrefilledFields.length > 0 && (
        <div style={{
          background: 'rgba(255, 200, 87, 0.04)', border: '1px dashed var(--yellow)',
          color: 'var(--yellow)', padding: '10px 14px', borderRadius: 4, marginBottom: 14,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.02em'
        }}>
          Notice: Highlights indicate fields pre-filled from screenshot analysis by AI. Please review values for complete mathematical accuracy.
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Entry Date *</label>
            <input type="date" value={form.trade_date} onChange={e => set('trade_date', e.target.value)}
              style={{ borderColor: errors.trade_date ? 'var(--red)' : '' }} />
            <Err msg={errors.trade_date} />
          </div>

          <div className="form-group">
            <label className="form-label">Asset Pair *</label>
            <select value={form.pair} onChange={e => set('pair', e.target.value)} style={aiHighlightStyle('pair')}>
              {config.pairs.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="form-grid3" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Entry Price *</label>
            <input type="number" step="any" value={form.entry_price} onChange={e => set('entry_price', e.target.value)}
              placeholder="0.00" style={{ borderColor: errors.entry_price ? 'var(--red)' : '', ...aiHighlightStyle('entry_price') }} />
            <Err msg={errors.entry_price} />
          </div>

          <div className="form-group">
            <label className="form-label">Take Profit (TP)</label>
            <input type="number" step="any" value={form.target_price} onChange={e => set('target_price', e.target.value)}
              placeholder="0.00" style={aiHighlightStyle('target_price')} />
            <Err msg={errors.target_price} />
          </div>

          <div className="form-group">
            <label className="form-label">Stop Loss *</label>
            <input type="number" step="any" value={form.stop_loss} onChange={e => set('stop_loss', e.target.value)}
              placeholder="0.00" style={{ borderColor: errors.stop_loss ? 'var(--red)' : '', ...aiHighlightStyle('stop_loss') }} />
            <Err msg={errors.stop_loss} />
          </div>
        </div>

        {isProfessional && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Advanced Trade Metrics & Parameters
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Exit Date</label>
                <input type="date" value={form.exit_date} onChange={e => set('exit_date', e.target.value)} min={form.trade_date} />
              </div>
              <div className="form-group">
                <label className="form-label">Execution Setup</label>
                <select value={form.setup_type} onChange={e => set('setup_type', e.target.value)}>
                  <option value="">— Select Strategy Setup —</option>
                  {config.setupTypes.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">Entry Time {session && <span className="mono" style={{ color: 'var(--blue)' }}>[{session}]</span>}</label>
                <input type="time" value={form.time_entry} onChange={e => set('time_entry', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Exit Time</label>
                <input type="time" value={form.time_out} onChange={e => set('time_out', e.target.value)} />
              </div>
            </div>

            <div className="form-grid3" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">Lot Size</label>
                <input type="number" step="any" value={form.lot_size} onChange={e => set('lot_size', e.target.value)} placeholder="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Risk Cost ($)</label>
                <input type="number" step="any" value={form.loss_amount} onChange={e => set('loss_amount', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Tick Size</label>
                <input type="number" step="any" value={form.tick_size} onChange={e => set('tick_size', e.target.value)} placeholder={`Default: ${defTick(form.pair)}`} />
              </div>
            </div>

            {config.behaviorTags?.length > 0 && (
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: 8 }}>Psychological & Behavior Tags</label>
                <div className="tag-pills">
                  {config.behaviorTags.map(tag => (
                    <button key={tag} className={`tag-pill ${form.tags.includes(tag) ? 'active' : ''}`}
                      onClick={() => toggleTag(tag)}>{tag}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Chart Image URL (Drag files or Paste screenshot here!)</label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.length) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  style={{ position: 'relative', width: '100%' }}
                >
                  <input 
                    type="url" 
                    value={form.image_link} 
                    onChange={e => set('image_link', e.target.value)} 
                    onPaste={handlePaste}
                    placeholder={uploading ? "Storing file on Supabase..." : aiAnalyzing ? "AI is processing metrics..." : "Paste screenshot or Drag image here..."} 
                    disabled={uploading || aiAnalyzing}
                    style={{ paddingRight: (uploading || aiAnalyzing) ? '50px' : '12px' }}
                  />
                  {(uploading || aiAnalyzing) && (
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 700, color: 'var(--green)' }}>
                      {uploading ? 'UPLOADING...' : 'AI ANALYZING...'}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Video Analysis URL</label>
                <input type="url" value={form.video_link} onChange={e => set('video_link', e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Journal Notes & Analysis</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Market context, management rules, emotional triggers, trade reviews..." style={{ height: 80 }} />
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div className="auto-calc" style={{ marginBottom: 16 }}>
            <div className="ac-item"><div className="ac-label">Calculated Dir</div>
              <div className="ac-val" style={{ color: acColor }}>{auto.dir || '—'}</div></div>
            <div className="ac-item"><div className="ac-label">TP (R)</div>
              <div className="ac-val" style={{ color: auto.tpR > 0 ? 'var(--green)' : 'var(--t2)' }}>{auto.tpR ?? '—'}</div></div>
            <div className="ac-item"><div className="ac-label">SL (R)</div>
              <div className="ac-val" style={{ color: 'var(--red)' }}>{auto.slR ?? '—'}</div></div>
            <div className="ac-item"><div className="ac-label">R:R Ratio</div>
              <div className="ac-val" style={{ color: 'var(--yellow)' }}>{auto.rr ? '1:' + auto.rr : '—'}</div></div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Execution Outcome</label>
              {form.result && (
                <button className="btn-link" onClick={() => set('result', '')} style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700 }}>
                  Keep Active / Open Position
                </button>
              )}
            </div>
            <div className="dir-toggle">
              <button className={`dir-btn buy ${form.result === 'Win' ? 'active' : ''}`} onClick={() => set('result', 'Win')} style={{ borderColor: errors.result && !form.result ? 'var(--red)' : '' }}>WIN</button>
              <button className={`dir-btn sell ${form.result === 'Loss' ? 'active' : ''}`} onClick={() => set('result', 'Loss')} style={{ borderColor: errors.result && !form.result ? 'var(--red)' : '' }}>LOSS</button>
              <button className={`dir-btn ${form.result === 'Miss' ? 'active' : ''}`} onClick={() => set('result', 'Miss')} style={{ borderColor: errors.result && !form.result ? 'var(--red)' : '' }}>MISS</button>
            </div>
            {!form.result && <div className="form-hint" style={{ marginTop: 6 }}>* Keep empty to record as an Active/Open Position</div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {isEdit && <button className="btn-ghost" onClick={onEditDone}>Cancel</button>}
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || uploading || aiAnalyzing}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Record Transaction'}
          </button>
        </div>
      </div>
    </div>
  )
}