import { useState, useEffect, useMemo } from 'react'
import { getDashboardStats, getByDayOfWeek, getByHour } from '../lib/api'
import { supabase } from '../lib/supabase'

export function usePerformance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dow, setDow] = useState([])
  const [hourly, setHourly] = useState([])
  const [crossTabStats, setCrossTabStats] = useState([])

  const [streakDays, setStreakDays] = useState(0)
  const [adherenceScore, setAdherenceScore] = useState(0)

  useEffect(() => {
    // ซ่อมแซมระบบดึงข้อมูล View สีกริด: ใช้ then() ครอบก่อน เพื่อบังคับให้แปลงสภาพเป็นมาตรฐาน Promise ที่รองรับ catch()
    Promise.all([
      getDashboardStats().catch(() => null),
      getByDayOfWeek().catch(() => []),
      getByHour().catch(() => []),
      supabase.from('v_multi_dim_expectancy').select('*')
        .then(res => res) // แปรรูปสัญญาสำเร็จรูป
        .catch(() => ({ data: [] }))
    ]).then(([stats, dowData, hourData, crossRes]) => {
      if (stats) {
        setData(stats)
        setStreakDays(stats.streak || 0)
        setAdherenceScore(stats.adherence || 0)
      }
      setDow(dowData || [])
      setHourly(hourData || [])
      setCrossTabStats(crossRes?.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const ov = useMemo(() => data?.overall || {}, [data])
  const wr = useMemo(() => parseFloat(ov?.win_rate) || 0, [ov])
  const totalRR = useMemo(() => parseFloat(ov?.total_rr) || 0, [ov])

  const equityCurve = useMemo(() => {
    if (!data?.recent) return []
    return [...data.recent].reverse().reduce((acc, t) => {
      const prev = acc.length ? acc[acc.length - 1].y : 0
      const delta = t.result === 'Win' ? (parseFloat(t.rr) || 1) : t.result === 'Loss' ? -1 : 0
      acc.push({ x: acc.length + 1, y: +(prev + delta).toFixed(2) })
      return acc
    }, [])
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
    equityCurve,
    sessMap,
    dow,
    hourly,
    crossTabStats,
    streakDays,
    adherenceScore
  }
}