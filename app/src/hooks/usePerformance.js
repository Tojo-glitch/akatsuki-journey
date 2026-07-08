import { useState, useEffect, useMemo } from 'react'
import { getDashboardStats, getByDayOfWeek, getByHour } from '../lib/api'
import { supabase } from '../lib/supabase'

export function usePerformance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dow, setDow] = useState([])
  const [hourly, setHourly] = useState([])
  const [crossTabStats, setCrossTabStats] = useState([])
  const [pairIntelligence, setPairIntelligence] = useState([])
  const [tagAnalysis, setTagAnalysis] = useState([])
  const [conLossDetail, setConLossDetail] = useState([])
  const [equityDrawdownData, setEquityDrawdownData] = useState([])
  const [staleHygieneCount, setStaleHygieneCount] = useState(0)
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [setupSessionExpectancy, setSetupSessionExpectancy] = useState([])
  const [rDistribution, setRDistribution] = useState([])

  const [streakDays, setStreakDays] = useState(0)
  const [adherenceScore, setAdherenceScore] = useState(0)

  // แผงตัวกรองช่วงเวลาไดนามิก
  const [period, setPeriod] = useState('all') // 'all', '30d', 'mtd'

  const dateFilterFrom = useMemo(() => {
    if (period === 'all') return null
    const now = new Date()
    if (period === '30d') {
      now.setDate(now.getDate() - 30)
      return now.toISOString().slice(0, 10)
    }
    if (period === 'mtd') {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    }
    return null
  }, [period])

  const loadData = async () => {
    setLoading(true)
    
    let overallQuery = supabase.from('v_dashboard_overall').select('*')
    let pairQuery = supabase.from('v_dashboard_by_pair').select('*')
    let sessionQuery = supabase.from('v_dashboard_by_session').select('*')
    let setupQuery = supabase.from('v_dashboard_by_setup').select('*')
    let calendarQuery = supabase.from('v_calendar_daily').select('*').order('trade_date', { ascending: false }).limit(365)
    let recentQuery = supabase.from('trades').select('*').order('trade_date', { ascending: false }).limit(100)
    
    let crossQuery = supabase.from('v_multi_dim_expectancy').select('*')
    let intelligenceQuery = supabase.from('v_pair_intelligence_matrix').select('*')
    let tagQuery = supabase.from('v_tag_analysis').select('*')
    let conLossQuery = supabase.from('v_con_loss_detail').select('*')
    let drawdownQuery = supabase.from('v_equity_drawdown').select('*')
    let hygieneQuery = supabase.from('v_data_hygiene_stale').select('*')
    let trendQuery = supabase.from('v_monthly_performance_trend').select('*')
    let setupSessQuery = supabase.from('v_setup_session_expectancy').select('*')
    let rDistQuery = supabase.from('v_r_distribution').select('*')

    if (dateFilterFrom) {
      overallQuery = overallQuery.gte('trade_date', dateFilterFrom)
      drawdownQuery = drawdownQuery.gte('trade_date', dateFilterFrom)
      calendarQuery = calendarQuery.gte('trade_date', dateFilterFrom)
      recentQuery = recentQuery.gte('trade_date', dateFilterFrom)
    }

    // ห่อหุ้มคิวรี่ทั้งหมดด้วย then() ป้องกันสิทธิ์คลาดเคลื่อนและพิมพ์แจ้งเตือนใน Console
    Promise.all([
      overallQuery.then(res => { if (res.error) console.error("overallQuery failed:", res.error); return res; }).catch(() => null),
      pairQuery.then(res => { if (res.error) console.error("pairQuery failed:", res.error); return res; }).catch(() => []),
      sessionQuery.then(res => { if (res.error) console.error("sessionQuery failed:", res.error); return res; }).catch(() => []),
      setupQuery.then(res => { if (res.error) console.error("setupQuery failed:", res.error); return res; }).catch(() => []),
      calendarQuery.then(res => { if (res.error) console.error("calendarQuery failed:", res.error); return res; }).catch(() => []),
      recentQuery.then(res => { if (res.error) console.error("recentQuery failed:", res.error); return res; }).catch(() => []),
      
      getByDayOfWeek().catch(() => []),
      getByHour().catch(() => []),
      
      crossQuery.then(res => { if (res.error) console.error("crossQuery failed:", res.error); return res; }).catch(() => ({ data: [] })),
      intelligenceQuery.then(res => { if (res.error) console.error("intelligenceQuery failed:", res.error); return res; }).catch(() => ({ data: [] })),
      tagQuery.then(res => { if (res.error) console.error("tagQuery failed:", res.error); return res; }).catch(() => ({ data: [] })),
      conLossQuery.then(res => { if (res.error) console.error("conLossQuery failed:", res.error); return res; }).catch(() => ({ data: [] })),
      drawdownQuery.then(res => { if (res.error) console.error("drawdownQuery failed:", res.error); return res; }).catch(() => ({ data: [] })),
      hygieneQuery.then(res => { if (res.error) console.error("hygieneQuery failed:", res.error); return res; }).catch(() => ({ data: [] })),
      trendQuery.then(res => { if (res.error) console.error("trendQuery failed:", res.error); return res; }).catch(() => ({ data: [] })),
      setupSessQuery.then(res => { if (res.error) console.error("setupSessQuery failed:", res.error); return res; }).catch(() => ({ data: [] })),
      rDistQuery.then(res => { if (res.error) console.error("rDistQuery failed:", res.error); return res; }).catch(() => ({ data: [] })),
      
      supabase.from('v_logging_streak').select('*').single()
        .then(res => { if (res.error) console.error("streakQuery failed:", res.error); return res; }).catch(() => null),
      supabase.from('v_adherence_score').select('*').single()
        .then(res => { if (res.error) console.error("adherenceQuery failed:", res.error); return res; }).catch(() => null)
    ]).then(([ovRes, pairRes, sessRes, setupRes, calRes, recentRes, dowRes, hourRes, crossRes, intellRes, tagRes, conLossRes, ddRes, hygieneRes, trendRes, setupSessRes, rDistRes, streakRes, adherenceRes]) => {
      
      setData({
        overall: ovRes?.data?.[0] || ovRes?.data || {},
        byPair: pairRes?.data || [],
        bySession: sessRes?.data || [],
        bySetup: setupRes?.data || [],
        calendar: calRes?.data || [],
        recent: recentRes?.data || [],
        streak: streakRes?.data?.current_streak_days || 0,
        adherence: adherenceRes?.data?.adherence_score_pct || 0
      })

      setDow(dowRes || [])
      setHourly(hourRes || [])
      setCrossTabStats(crossRes?.data || [])
      setPairIntelligence(intellRes?.data || [])
      setTagAnalysis(tagRes?.data || [])
      setConLossDetail(conLossRes?.data || [])
      setEquityDrawdownData(ddRes?.data || [])
      setStaleHygieneCount(hygieneRes?.data?.length || 0)
      setMonthlyTrend(trendRes?.data || [])
      setSetupSessionExpectancy(setupSessRes?.data || [])
      setRDistribution(rDistRes?.data || [])

      setLoading(false)
    }).catch((err) => {
      console.error("Unhandled promise error inside hook:", err)
      setLoading(false)
    })
  }

  useEffect(() => { loadData() }, [period])

  const ov = useMemo(() => data?.overall || {}, [data])
  const wr = useMemo(() => parseFloat(ov?.win_rate) || 0, [ov])
  const totalRR = useMemo(() => parseFloat(ov?.total_rr) || 0, [ov])

  // พิกัดกราฟกำไรสะสม ตรึงจุดเริ่มต้นไม้ที่ 0 ป้องกันกราฟเปล่า
  const equityCurve = useMemo(() => {
    if (!data?.recent || data.recent.length === 0) return []
    const curve = [...data.recent].reverse().reduce((acc, t) => {
      const prev = acc.length ? acc[acc.length - 1].y : 0
      const delta = t.result === 'Win' ? (parseFloat(t.rr) || 1) : t.result === 'Loss' ? -1 : 0
      acc.push({ x: acc.length + 1, y: +(prev + delta).toFixed(2) })
      return acc
    }, [])
    return [{ x: 0, y: 0 }, ...curve]
  }, [data])

  const sessMap = useMemo(() => {
    const map = {}
    ;(data?.bySession || []).forEach(s => {
      if (s?.session) map[s.session] = s
    })
    return map
  }, [data])

  return {
    data,
    loading,
    ov,
    wr,
    totalRR,
    sessMap,
    dow,
    hourly,
    crossTabStats,
    pairIntelligence,
    tagAnalysis,
    conLossDetail,
    equityDrawdownData,
    staleHygieneCount,
    monthlyTrend,
    setupSessionExpectancy,
    rDistribution,
    period,
    setPeriod,
    streakDays,
    adherenceScore,
    equityCurve
  }
}