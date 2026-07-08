import { useState, useEffect, useCallback, useMemo } from 'react'
import { getTrades, quickUpdateResult, deleteTrade, importTradesBatch } from '../lib/api'

const PAGE_SIZE = 50

function sortTrades(trades) {
  return [...trades].sort((a, b) => {
    const dA = a.trade_date || '', dB = b.trade_date || ''
    if (dA !== dB) return dB.localeCompare(dA)
    return (b.time_entry || '').localeCompare(a.time_entry || '')
  })
}

function markDuplicates(trades) {
  const seen = {}
  return trades.map(t => {
    const key = `${t.pair}|${t.trade_date}|${t.entry_price}`
    const isDup = !!seen[key]
    seen[key] = true
    return { ...t, isDuplicate: isDup }
  })
}

export function useTradeQueries({ toast, requirePin }) {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ pair: 'all', result: 'all', session: 'all', setup: 'all' })
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0) // สำหรับทำ Pagination จริงจากฐานข้อมูล
  const [confirm, setConfirm] = useState(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  // ── อัปเกรด: สั่งโหลดเฉพาะดีลตามตัวแปรค้นหาและการแบ่งหน้าจริงรายแถว ──
  const load = useCallback(async () => {
    setLoading(true)
    try {
      // ยิงสัญญานไปแบ่งหน้าและค้นหาแบบ Global บนหลังบ้าน PostgreSQL จริงๆ
      const { data, totalCount } = await getTrades({ 
        ...filters, 
        from: dateFrom || undefined, 
        to: dateTo || undefined, 
        search: search || undefined,
        page, 
        limit: PAGE_SIZE 
      })
      setTrades(sortTrades(data))
      setTotalRecords(totalCount)
    } catch (e) { 
      toast(e.message, 'error') 
    }
    setLoading(false)
  }, [filters, dateFrom, dateTo, search, page, toast])

  useEffect(() => { load() }, [load])

  const setF = (k, v) => {
    setFilters(f => ({ ...f, [k]: v }))
    setPage(1) // รีเซ็ตหน้ากลับเป็นหน้าแรกเมื่อตัวกรองเปลี่ยน
  }

  const allFiltered = useMemo(() => {
    return markDuplicates(trades)
  }, [trades])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalRecords / PAGE_SIZE)), [totalRecords])

  const statsSummary = useMemo(() => {
    const totalW = allFiltered.filter(t => t.result === 'Win').length
    const totalL = allFiltered.filter(t => t.result === 'Loss').length
    const eligible = allFiltered.filter(t => t.result !== 'Miss' && t.result).length
    const wr = eligible ? Math.round((totalW / eligible) * 100) : 0
    
    let netR = 0
    let totalLossAmt = 0

    allFiltered.forEach(t => {
      if (t.result === 'Win') {
        netR += (parseFloat(t.rr) || 1)
      } else if (t.result === 'Loss') {
        netR -= 1
        totalLossAmt += (parseFloat(t.loss_amount) || 0)
      }
    })

    return { totalW, totalL, wr, netR, totalLossAmt }
  }, [allFiltered])

  const handleQuickResult = useCallback((trade, result) => {
    requirePin(async pin => {
      const res = await quickUpdateResult(pin, trade.id, result)
      if (res?.success) { 
        toast('Result updated')
        load() 
      } else {
        toast(res?.message || 'Error', 'error')
      }
    })
  }, [requirePin, toast, load])

  const confirmDelete = useCallback((id) => {
    setConfirm(null)
    requirePin(async pin => {
      try {
        const res = await deleteTrade(pin, id)
        if (res?.success) { 
          toast('Trade deleted')
          load() 
        } else {
          toast(res?.message || 'Delete failed', 'error')
        }
      } catch (e) { 
        toast(e.message, 'error') 
      }
    })
  }, [requirePin, toast, load])

  return {
    loading,
    allFiltered,
    displayed: allFiltered, // เลิกตัดสไลด์แบบ 300 แถว เพราะเราดึงมาทีละ 50 แถวตรงรุ่นจาก DB แล้ว!
    statsSummary,
    search,
    setSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filters,
    setF,
    page,
    setPage,
    totalPages,
    confirm,
    setConfirm,
    exporting,
    importing,
    confirmDelete,
    handleQuickResult
  }
}