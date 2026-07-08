import { supabase } from './supabase'

// ── 🌟 PHASE 6: ฟังก์ชันสกัด Session ID อ้างอิงตัวตนรายเบราว์เซอร์ ──
export function getClientSessionId() {
  const KEY = 'tj_client_session_id'
  let sessionVal = sessionStorage.getItem(KEY);
  if (!sessionVal) {
    sessionVal = crypto.randomUUID()
    sessionStorage.setItem(KEY, sessionVal)
  }
  return sessionVal
}

// ── Network wrapper — จับ error ทุก call รวมกัน ─────────────────
async function rpc(fn, params) {
  try {
    const { data, error } = await supabase.rpc(fn, params)
    if (error) throw error
    return data
  } catch (err) {
    if (!navigator.onLine) throw new Error('No internet connection')
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

// ── Config ──────────────────────────────────────────────────────
export async function getConfig() {
  try {
    const { data } = await fromTable(supabase.from('app_config').select('key,value'))
    const map = {}
    data?.forEach(r => { map[r.key] = r.value })
    return {
      pairs:        (map.pairs         || 'XAUUSD,EURUSD,GBPUSD,USDJPY,BTCUSD').split(',').map(s => s.trim()).filter(Boolean),
      setupTypes:   (map.setup_types   || 'BOS,OB,FVG,Other').split(',').map(s => s.trim()).filter(Boolean),
      behaviorTags: (map.behavior_tags || 'Planned,Revenge Trade,FOMO,Disciplined').split(',').map(s => s.trim()).filter(Boolean),
    }
  } catch {
    return {
      pairs:        ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'],
      setupTypes:   ['BOS', 'OB', 'FVG', 'Liquidity Sweep', 'MSS', 'Other'],
      behaviorTags: ['Planned', 'Revenge Trade', 'FOMO', 'Disciplined'],
    }
  }
}

// ── PIN Verification (ส่งพ่วง Session ID เข้าไปตรวจจับสกัดกั้นแฮกเกอร์) ───────
export async function verifyPin(pin) {
  try {
    const data = await rpc('verify_pin', { 
      p_pin: String(pin),
      p_session_id: getClientSessionId()
    })
    return data
  } catch (err) {
    return { success: false, message: err.message || 'Verification exception' }
  }
}

// ── 🌟 PHASE 11: CANVASES COMPRESSION (ระบบบีบอัดรูปภาพก่อนอัปโหลดขึ้น Cloud) ──
function compressImage(file, maxWidth = 1280, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
    };
  });
}

export async function uploadChartImage(file) {
  try {
    const processedFile = await compressImage(file);
    const fileExt = 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('trade-charts')
      .upload(filePath, processedFile);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('trade-charts')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (err) {
    console.error('Storage upload aborted:', err);
    return { success: false, message: err.message || 'Storage error' };
  }
}

// ── 🌟 PHASE 7: SMART AI EXTRACTOR (ท่อดึงข้อมูลภาพผ่านกูเกิล Gemini) ──
export async function analyzeChartImage(imageUrl) {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-chart', {
      body: { image_url: imageUrl }
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('AI analyzer exception:', err);
    return { success: false, message: err.message };
  }
}

// ── CRUD (เปลี่ยนจากส่ง PIN เป็นการส่งผ่าน UUID Token แทน!) ──────────────
export async function getTrades({ pair, result, session, setup, from, to, search, page = 1, limit = 50 } = {}) {
  let q = supabase
    .from('trades')
    .select('*', { count: 'exact' })
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false });

  const fromRow = (page - 1) * limit;
  const toRow = fromRow + limit - 1;
  q = q.range(fromRow, toRow);

  if (pair   && pair   !== 'all') q = q.eq('pair', pair)
  if (result && result !== 'all') q = q.eq('result', result)
  if (session && session !== 'all') q = q.eq('session', session)
  if (setup  && setup  !== 'all') q = q.eq('setup_type', setup)
  if (from) q = q.gte('trade_date', from)
  if (to)   q = q.lte('trade_date', to)

  if (search && search.trim() !== '') {
    const queryTerm = `%${search.trim()}%`;
    q = q.or(`pair.ilike.${queryTerm},notes.ilike.${queryTerm},setup_type.ilike.${queryTerm}`);
  }

  const { data, error, count } = await q;
  if (error) throw error;
  
  return { 
    data: data || [], 
    totalCount: count || 0
  };
}

export async function addTrade(token, tradeData) {
  const data = await rpc('add_trade', { p_token: token, p_data: {
    ...tradeData,
    session_id: getClientSessionId()
  } })
  if (data === null) return { success: false, message: 'No response — check database connection' }
  return data
}

export async function editTrade(token, id, tradeData) {
  const data = await rpc('edit_trade', { p_token: token, p_id: id, p_data: {
    ...tradeData,
    session_id: getClientSessionId()
  } })
  if (data === null) return { success: false, message: 'No response — check database connection' }
  return data
}

export async function deleteTrade(token, id) {
  const data = await rpc('delete_trade', { p_token: token, p_id: id })
  if (data === null) return { success: false, message: 'No response — check database connection' }
  return data
}

// ── 🌟 [ซ่อมแซมระดับความปลอดภัย]: ฟังก์ชันเปลี่ยนสถานะผลออเดอร์ด่วนรายแถว ──
export async function quickUpdateResult(token, id, result) {
  const data = await rpc('quick_update_result', { p_token: token, p_id: id, p_result: result })
  if (data === null) return { success: false, message: 'No response — check database connection' }
  return data
}

export async function changePin(token, oldPin, newPin) {
  try {
    const data = await rpc('change_pin', { p_token: token, p_old_pin: String(oldPin), p_new_pin: String(newPin) })
    return data
  } catch (err) {
    return { success: false, message: err.message || 'Unknown error' }
  }
}

// ── Dashboard Stats ─────────────────────────────────────────────
export async function getDashboardStats() {
  const [overall, byPair, bySession, bySetup, calendar, recent, streakRes, adherenceRes] = await Promise.all([
    supabase.from('v_dashboard_overall').select('*').single(),
    supabase.from('v_dashboard_by_pair').select('*'),
    supabase.from('v_dashboard_by_session').select('*'),
    supabase.from('v_dashboard_by_setup').select('*'),
    supabase.from('v_calendar_daily').select('*').order('trade_date', { ascending: false }).limit(365),
    supabase.from('trades')
      .select('id,trade_date,exit_date,pair,direction,setup_type,session,rr,result,con_loss,image_link,video_link,tags,notes')
      .order('trade_date', { ascending: false }).limit(100),
    supabase.from('v_logging_streak').select('*').single(),
    supabase.from('v_adherence_score').select('*').single()
  ])

  return {
    overall:   overall.data   || {},
    byPair:    byPair.data    || [],
    bySession: bySession.data || [],
    bySetup:   bySetup.data   || [],
    calendar:  calendar.data  || [],
    recent:    recent.data    || [],
    streak:    streakRes?.data?.current_streak_days || 0,
    adherence: adherenceRes?.data?.adherence_score_pct || 0
  }
}

// ── Settings ─────────────────────────────────────────────────────
export async function savePairs(token, pairs) {
  const data = await rpc('save_pairs', { p_token: token, p_pairs: pairs.join(',') })
  if (data === null) return { success: false, message: 'No response from database' }
  return data
}

export async function saveSetupTypes(token, types) {
  const data = await rpc('save_setup_types', { p_token: token, p_setups: types.join(',') })
  if (data === null) return { success: false, message: 'No response from database' }
  return data
}

export async function saveBehaviorTags(token, tags) {
  const data = await rpc('save_behavior_tags', { p_token: token, p_tags: tags.join(',') })
  if (data === null) return { success: false, message: 'No response from database' }
  return data
}

// ── Visitor tracking ──────────────────────────────────────────
export async function trackPageView(page) {
  try {
    await supabase.from('page_views').insert({
      page,
      session_id: getClientSessionId(),
      referrer:   document.referrer || null,
      user_agent: navigator.userAgent?.slice(0, 200) || null,
    })
  } catch { /* silent */ }
}

export async function getAccessFootprint(token, limit = 100) {
  try {
    const { data, error } = await supabase
      .from('v_access_footprint')
      .select('*')
      .limit(limit)
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err) {
    return { success: false, message: err.message || 'Verification exception' }
  }
}

export async function getStaleActiveTrades(token) {
  try {
    const { data, error } = await supabase
      .from('v_data_hygiene_stale')
      .select('*')
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

export async function getAuditLog(token, limit = 50) {
  try {
    const data = await rpc('get_audit_log', { p_token: token, p_limit: limit })
    return data
  } catch (err) {
    return { success: false, message: err.message }
  }
}

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

// ── Phase 5 ──────────────────────────────────────────────────────
export async function importTradesBatch(token, rows) {
  try {
    const data = await rpc('import_trades_batch', { p_token: token, p_rows: rows })
    if (data === null) return { success: false, message: 'No response from database' }
    return data
  } catch (err) {
    return { success: false, message: err.message }
  }
}

export async function deleteTradesByPair(token, pair) {
  try {
    const data = await rpc('delete_trades_by_pair', { p_token: token, p_pair: pair })
    if (data === null) return { success: false, message: 'No response from database' }
    return data
  } catch (err) {
    return { success: false, message: err.message }
  }
}

export async function exportAllTrades(token) {
  try {
    const data = await rpc('export_all_trades', { p_token: token })
    if (data === null) return { success: false, message: 'No response from database' }
    return data
  } catch (err) {
    return { success: false, message: err.message }
  }
}

// ── Phase 7 ──────────────────────────────────────────────────────
export async function getEquityDrawdown() {
  try {
    const { data } = await supabase
      .from('v_equity_drawdown')
      .select('x,trade_date,pair,result,equity,drawdown,peak')
      .order('x', { ascending: true })
    return data || []
  } catch { return [] }
}

export async function getTagAnalysis() {
  try {
    const { data } = await supabase
      .from('v_tag_analysis')
      .select('*')
      .order('total', { ascending: false })
    return data || []
  } catch { return [] }
}

export async function getComments(tradeId) {
  try {
    const { data, error } = await supabase
      .from('trade_comments')
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Failed to load feedback comments:', err)
    return []
  }
}

export async function addComment(token, tradeId, authorName, content, imageUrl, linkUrl, parentId = null, status = 'Pending', pinX = null, pinY = null) {
  return await rpc('add_comment', {
    p_token: token,
    p_trade_id: tradeId,
    p_author: authorName,
    p_content: content,
    p_image: imageUrl || null,
    p_link: linkUrl || null,
    p_parent_id: parentId || null,
    p_status: status,
    p_pin_x: pinX,
    p_pin_y: pinY
  })
}

export async function markCommentsRead(ownerToken, tradeId) {
  return await rpc('mark_comments_read', {
    p_token: ownerToken,
    p_trade_id: tradeId
  })
}