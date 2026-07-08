import { useState, useEffect, useCallback } from 'react'
import { addTrade, editTrade } from '../lib/api'
import { validate } from '../components/UI'

const TICK_MAP = { 
  XAUUSD: 0.1, XAGUSD: 0.01, USDJPY: 0.01, EURJPY: 0.01, GBPJPY: 0.01,
  AUDJPY: 0.01, CADJPY: 0.01, BTCUSD: 1, ETHUSD: 1, default: 0.0001 
}

function getSession(t) {
  if (!t) return ''
  const h = parseInt(t.split(':')[0])
  return h >= 1 && h < 8 ? 'Asia' : h >= 8 && h < 16 ? 'London' : 'New York'
}

function calcAuto(entry, target, sl, tick) {
  const e = parseFloat(entry), t = parseFloat(target), s = parseFloat(sl), tk = parseFloat(tick) || 0.0001
  if (!e || !s || isNaN(e) || isNaN(s) || e === s) return {}
  const dir = e > s ? 'Buy' : 'Sell'
  const slR = +((dir === 'Buy' ? e - s : s - e) / tk).toFixed(2)
  const tpR = (t && !isNaN(t)) ? +((dir === 'Buy' ? t - e : e - t) / tk).toFixed(2) : null
  const rr = (tpR && slR && slR > 0) ? +(tpR / slR).toFixed(2) : null
  return { dir, slR, tpR, rr }
}

export function useTradeForm({ config, requirePin, toast, editData, onEditDone }) {
  const isEdit = !!editData
  const defTick = (pair) => TICK_MAP[pair] ?? TICK_MAP.default

  const blank = () => ({
    pair: config.pairs[0] || 'XAUUSD', 
    trade_date: new Date().toISOString().slice(0, 10),
    exit_date: '', 
    time_entry: '', 
    time_out: '', 
    direction: '',
    setup_type: config.setupTypes[0] || '',
    entry_price: '', 
    target_price: '', 
    stop_loss: '', 
    tick_size: '',
    lot_size: '', 
    loss_amount: '',
    result: '', 
    image_link: '', 
    video_link: '', 
    notes: '', 
    tags: [],
  })

  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editData) {
      setForm({
        pair:         editData.pair         || config.pairs[0],
        trade_date:   editData.trade_date   || new Date().toISOString().slice(0, 10),
        exit_date:    editData.exit_date    || '',
        time_entry:   editData.time_entry   || '',
        time_out:     editData.time_out     || '',
        direction:    editData.direction    || '',
        setup_type:   editData.setup_type   || '',
        entry_price:  editData.entry_price  ?? '',
        target_price: editData.target_price ?? '',
        stop_loss:    editData.stop_loss    ?? '',
        tick_size:    editData.tick_size    ?? '',
        lot_size:     editData.lot_size     ?? '',
        loss_amount:  editData.loss_amount  ?? '',
        result:       editData.result       || '',
        image_link:   editData.image_link   || '',
        video_link:   editData.video_link   || '',
        notes:        editData.notes        || '',
        tags:         editData.tags         || [],
      })
      setErrors({})
    } else {
      setForm(blank())
      setErrors({})
    }
  }, [editData])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  const tick = parseFloat(form.tick_size) || defTick(form.pair)
  const auto = calcAuto(form.entry_price, form.target_price, form.stop_loss, tick)
  const session = getSession(form.time_entry)
  const toggleTag = tag => set('tags', form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag])

  const handleSubmit = useCallback(() => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { 
      setErrors(errs)
      toast('Please fix validation errors', 'error')
      return 
    }

    const data = {
      ...form,
      tick_size:    parseFloat(form.tick_size)    || defTick(form.pair),
      entry_price:  parseFloat(form.entry_price)  || null,
      target_price: parseFloat(form.target_price) || null,
      stop_loss:    parseFloat(form.stop_loss)    || null,
      lot_size:     parseFloat(form.lot_size)     || null,
      loss_amount:  parseFloat(form.loss_amount)  || null,
      exit_date:    form.exit_date || null,
      result:       form.result || null,
    }

    requirePin(async pin => {
      setSaving(true)
      try {
        const res = isEdit ? await editTrade(pin, editData.id, data) : await addTrade(pin, data)
        if (res?.success) {
          toast(res.message || (isEdit ? 'Changes committed' : 'Trade recorded'))
          if (isEdit) { onEditDone(); return }
          setForm(blank())
          setErrors({})
        } else {
          toast(res?.message || 'Transaction rejected', 'error')
        }
      } catch (e) { 
        toast(e.message || 'Network error', 'error') 
      }
      setSaving(false)
    })
  }, [form, isEdit, editData, requirePin, toast, onEditDone])

  return {
    form,
    errors,
    saving,
    isEdit,
    defTick,
    set,
    auto,
    session,
    toggleTag,
    handleSubmit,
    blank
  }
}