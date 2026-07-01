import { supabase } from './supabase'

// ── Config ─────────────────────────────────────────────────────
export async function getConfig() {
  const { data } = await supabase.from('app_config').select('key,value')
  const map = {}
  data?.forEach(r => { map[r.key] = r.value })
  return {
    pairs: (map.pairs || 'XAUUSD,EURUSD,GBPUSD,USDJPY,BTCUSD').split(',').map(s => s.trim()),
    setupTypes: (map.setup_types || 'BOS,OB,FVG,Other').split(',').map(s => s.trim()),
    behaviorTags: (map.behavior_tags || 'Planned,Revenge Trade,FOMO,Disciplined').split(',').map(s => s.trim()),
  }
}

// ── PIN ────────────────────────────────────────────────────────
export async function verifyPin(pin) {
  const { data } = await supabase.rpc('verify_pin', { p_pin: pin })
  return !!data
}

export async function changePin(oldPin, newPin) {
  const { data } = await supabase.rpc('change_pin', { p_old_pin: oldPin, p_new_pin: newPin })
  return data
}

// ── Trades CRUD ────────────────────────────────────────────────
export async function getTrades({ pair, result, session, setup, from, to, limit = 200 } = {}) {
  let q = supabase
    .from('trades')
    .select('*')
    .order('trade_date', { ascending: false })
    .order('time_entry', { ascending: false })
    .limit(limit)

  if (pair && pair !== 'all') q = q.eq('pair', pair)
  if (result && result !== 'all') q = q.eq('result', result)
  if (session && session !== 'all') q = q.eq('session', session)
  if (setup && setup !== 'all') q = q.eq('setup_type', setup)
  if (from) q = q.gte('trade_date', from)
  if (to) q = q.lte('trade_date', to)

  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function addTrade(pin, tradeData) {
  const { data } = await supabase.rpc('add_trade', { p_pin: pin, p_data: tradeData })
  return data
}

export async function editTrade(pin, id, tradeData) {
  const { data } = await supabase.rpc('edit_trade', { p_pin: pin, p_id: id, p_data: tradeData })
  return data
}

export async function deleteTrade(pin, id) {
  const { data } = await supabase.rpc('delete_trade', { p_pin: pin, p_id: id })
  return data
}

export async function quickUpdateResult(pin, id, result) {
  const { data } = await supabase.rpc('quick_update_result', { p_pin: pin, p_id: id, p_result: result })
  return data
}

// ── Dashboard Stats ────────────────────────────────────────────
export async function getDashboardStats() {
  const [overall, byPair, bySession, bySetup, calendar, recent] = await Promise.all([
    supabase.from('v_dashboard_overall').select('*').single(),
    supabase.from('v_dashboard_by_pair').select('*'),
    supabase.from('v_dashboard_by_session').select('*'),
    supabase.from('v_dashboard_by_setup').select('*'),
    supabase.from('v_calendar_daily').select('*').order('trade_date', { ascending: false }).limit(365),
    supabase.from('trades').select('id,trade_date,pair,direction,setup_type,session,rr,result,con_loss')
      .order('trade_date', { ascending: false }).limit(300)
  ])

  return {
    overall: overall.data || {},
    byPair: byPair.data || [],
    bySession: bySession.data || [],
    bySetup: bySetup.data || [],
    calendar: calendar.data || [],
    recent: recent.data || []
  }
}

// ── Settings ───────────────────────────────────────────────────
export async function savePairs(pin, pairs) {
  const { data } = await supabase.rpc('save_pairs', { p_pin: pin, p_pairs: pairs.join(',') })
  return data
}

export async function saveSetupTypes(pin, types) {
  const { data } = await supabase.rpc('save_setup_types', { p_pin: pin, p_setups: types.join(',') })
  return data
}

export async function saveBehaviorTags(pin, tags) {
  const { data } = await supabase.rpc('save_behavior_tags', { p_pin: pin, p_tags: tags.join(',') })
  return data
}