import { supabase } from './supabase'

// ── Network wrapper — จับ error ทุก call รวมกัน ─────────────────
async function rpc(fn, params) {
  try {
    const { data, error } = await supabase.rpc(fn, params)
    if (error) throw error
    return data
  } catch (err) {
    // Network offline
    if (!navigator.onLine) throw new Error('No internet connection')
    // Supabase project paused
    if (err?.message?.includes('503') || err?.message?.includes('paused'))
      throw new Error('Database is temporarily unavailable. Try again in a moment.')
    throw err
  }
}

async function fromTable(query) {
  try {
    const result = await query
    if (result.error) throw result.error
    return result
  } catch (err) {
    if (!navigator.onLine) throw new Error('No internet connection')
    throw err
  }
}

// ── Config (เวอร์ชันปลอดภัย 100% ไร้หน้าจอขาว) ────────────────────────────────
export async function getConfig() {
  try {
    const response = await fromTable(supabase.from('app_config').select('key,value'))
    // ป้องกันกรณีส่งค่ากลับมาสลับรูปแบบกัน
    const actualData = response?.data || response || []
    
    const map = {}
    if (Array.isArray(actualData)) {
      actualData.forEach(r => { 
        if (r && r.key) map[r.key] = r.value 
      })
    }

    // ใส่เซฟตี้ดักไว้ทุกชั้นก่อนทำ .split()
    const rawPairs = map?.pairs || 'XAUUSD,EURUSD,GBPUSD,USDJPY,BTCUSD'
    const rawSetups = map?.setup_types || 'BOS,OB,FVG,Other'
    const rawTags = map?.behavior_tags || 'Planned,Revenge Trade,FOMO,Disciplined'

    return {
      pairs:        String(rawPairs).split(',').map(s => s.trim()).filter(Boolean),
      setupTypes:   String(rawSetups).split(',').map(s => s.trim()).filter(Boolean),
      behaviorTags: String(rawTags).split(',').map(s => s.trim()).filter(Boolean),
    }
  } catch (err) {
    console.error('Config fetch failed, using fallback:', err)
    // Fallback defaults เพื่อให้แอปทำงานต่อได้แม้ฐานข้อมูลจะว่างเปล่าหรือออฟไลน์
    return {
      pairs:        ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'],
      setupTypes:   ['BOS', 'OB', 'FVG', 'Liquidity Sweep', 'MSS', 'Other'],
      behaviorTags: ['Planned', 'Revenge Trade', 'FOMO', 'Disciplined'],
    }
  }
}

// ── PIN ─────────────────────────────────────────────────────────
export async function verifyPin(pin) {
  try {
    const data = await rpc('verify_pin', { p_pin: String(pin) })
    return !!data
  } catch {
    return false
  }
}

// Fix: changePin now properly surfaces errors and never silently fails
export async function changePin(oldPin, newPin) {
  try {
    const data = await rpc('change_pin', { p_old_pin: String(oldPin), p_new_pin: String(newPin) })
    // Supabase RPC returns JSON — handle both object and string
    if (typeof data === 'string') {
      try { return JSON.parse(data) } catch { return { success: false, message: data } }
    }
    if (data === null || data === undefined) {
      return { success: false, message: 'No response from database. Check your Supabase connection.' }
    }
    return data
  } catch (err) {
    return { success: false, message: err.message || 'Unknown error' }
  }
}

// ── Trades CRUD ─────────────────────────────────────────────────
export async function getTrades({ pair, result, session, setup, from, to, limit = 300 } = {}) {
  let q = supabase
    .from('trades')
    .select('*')
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (pair   && pair   !== 'all') q = q.eq('pair', pair)
  if (result && result !== 'all') q = q.eq('result', result)
  if (session && session !== 'all') q = q.eq('session', session)
  if (setup  && setup  !== 'all') q = q.eq('setup_type', setup)
  if (from) q = q.gte('trade_date', from)
  if (to)   q = q.lte('trade_date', to)

  const { data, error } = await fromTable(q)
  if (error) throw error
  return data || []
}

export async function addTrade(pin, tradeData) {
  const data = await rpc('add_trade', { p_pin: pin, p_data: tradeData })
  if (data === null) return { success: false, message: 'No response — check database connection' }
  return data
}

export async function editTrade(pin, id, tradeData) {
  const data = await rpc('edit_trade', { p_pin: pin, p_id: id, p_data: tradeData })
  if (data === null) return { success: false, message: 'No response — check database connection' }
  return data
}

export async function deleteTrade(pin, id) {
  const data = await rpc('delete_trade', { p_pin: pin, p_id: id })
  if (data === null) return { success: false, message: 'No response — check database connection' }
  return data
}

export async function quickUpdateResult(pin, id, result) {
  const data = await rpc('quick_update_result', { p_pin: pin, p_id: id, p_result: result })
  if (data === null) return { success: false, message: 'No response — check database connection' }
  return data
}

// ── Dashboard Stats ─────────────────────────────────────────────
export async function getDashboardStats() {
  const [overall, byPair, bySession, bySetup, calendar, recent] = await Promise.all([
    supabase.from('v_dashboard_overall').select('*').single(),
    supabase.from('v_dashboard_by_pair').select('*'),
    supabase.from('v_dashboard_by_session').select('*'),
    supabase.from('v_dashboard_by_setup').select('*'),
    supabase.from('v_calendar_daily').select('*').order('trade_date', { ascending: false }).limit(365),
    supabase.from('trades')
      .select('id,trade_date,exit_date,pair,direction,setup_type,session,rr,result,con_loss,image_link,video_link,tags,notes')
      .order('trade_date', { ascending: false }).limit(300),
  ])

  return {
    overall:   overall.data   || {},
    byPair:    byPair.data    || [],
    bySession: bySession.data || [],
    bySetup:   bySetup.data   || [],
    calendar:  calendar.data  || [],
    recent:    recent.data    || [],
  }
}

// ── Settings ─────────────────────────────────────────────────────
export async function savePairs(pin, pairs) {
  const data = await rpc('save_pairs', { p_pin: pin, p_pairs: pairs.join(',') })
  if (data === null) return { success: false, message: 'No response from database' }
  return data
}

export async function saveSetupTypes(pin, types) {
  const data = await rpc('save_setup_types', { p_pin: pin, p_setups: types.join(',') })
  if (data === null) return { success: false, message: 'No response from database' }
  return data
}

export async function saveBehaviorTags(pin, tags) {
  const data = await rpc('save_behavior_tags', { p_pin: pin, p_tags: tags.join(',') })
  if (data === null) return { success: false, message: 'No response from database' }
  return data
}

// ── Visitor tracking (Phase 3 — already wired up) ───────────────
export async function trackPageView(page) {
  try {
    await supabase.from('page_views').insert({
      page,
      referrer:   document.referrer || null,
      user_agent: navigator.userAgent?.slice(0, 200) || null,
    })
  } catch { /* silent — never block the UI */ }
}

export async function getVisitorStats(pin) {
  try {
    const data = await rpc('get_visitor_stats', { p_pin: pin })
    return data
  } catch (err) {
    return { success: false, message: err.message }
  }
}

// ── Audit log ────────────────────────────────────────────────────
export async function getAuditLog(pin, limit = 50) {
  try {
    const data = await rpc('get_audit_log', { p_pin: pin, p_limit: limit })
    return data
  } catch (err) {
    return { success: false, message: err.message }
  }
}

// ── Analytics views (Phase 5) ────────────────────────────────────
export async function getByDayOfWeek() {
  try {
    const { data } = await supabase.from('v_by_day_of_week').select('*')
    return data || []
  } catch { return [] }
}

export async function getByHour() {
  try {
    const { data } = await supabase.from('v_by_hour').select('*')
    return data || []
  } catch { return [] }
}

export async function getConLossDetail() {
  try {
    const { data } = await supabase.from('v_con_loss_detail').select('*')
    return data || []
  } catch { return [] }
}