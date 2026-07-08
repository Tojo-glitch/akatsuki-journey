import React, { useState, useMemo, useCallback } from 'react'
import { useTradeQueries } from '../hooks/useTradeQueries'
import { Confirm, Lightbox } from '../components/UI'
import FilterBar from '../components/history/FilterBar'
import TradeTable from '../components/history/TradeTable'
import CalendarGrid from '../components/calendar/CalendarGrid'
import DayDetailPanel from '../components/calendar/DayDetailPanel'

export default function History({ config, requirePin, toast, onEdit, isOwner }) {
  const [viewMode, setViewMode] = useState('list') // 'list' หรือ 'calendar'
  const [lightbox, setLightbox] = useState(null)

  // ดำเนินการคัดสรรสถิติหลักและ CRUD
  const {
    loading,
    allFiltered,
    displayed,
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
    exportCSV,
    handleImportFile,
    confirmImport,
    confirmDelete,
    handleQuickResult
  } = useTradeQueries({ toast, requirePin })

  const handleDelete = useCallback((id) => {
    setConfirm({ id, title: 'Delete Trade', msg: 'This trade will be permanently removed.' })
  }, [setConfirm])

  const { totalW, totalL, wr, netR, totalLossAmt } = statsSummary

  // ── ปฏิทินแบบ Reactive (คำนวณบนเบราว์เซอร์สดตามตรรกะแถบ Filters) ──
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  const calMap = useMemo(() => {
    const map = {}
    allFiltered.forEach(t => {
      const date = t.trade_date
      if (!map[date]) {
        map[date] = { total: 0, win: 0, loss: 0, miss: 0, net_rr: 0, trades: [] }
      }
      map[date].total++
      if (t.result === 'Win') {
        map[date].win++
        map[date].net_rr += (parseFloat(t.rr) || 1)
      } else if (t.result === 'Loss') {
        map[date].loss++
        map[date].net_rr -= 1
      } else {
        map[date].miss++
      }
      map[date].trades.push(t)
    })
    return map
  }, [allFiltered])

  const navigateCalendar = (dir) => {
    setSelectedDate(null)
    if (dir === -1 && month === 0) { setMonth(11); setYear(y => y - 1) }
    else if (dir === 1 && month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + dir)
  }

  const todayStrStr = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const moStr = String(month + 1).padStart(2, '0')

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Trade Ledger</div>
        
        {/* คอนโทรลสลับโหมดการดูข้อมูล (LIST / CALENDAR) ไร้อีโมจิ */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          {[['list', 'List Ledger'], ['calendar', 'Monthly Calendar']].map(([mode, label]) => (
            <button key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                background: viewMode === mode ? 'var(--card2)' : 'transparent',
                color: viewMode === mode ? 'var(--green)' : 'var(--t2)',
                border: 'none', padding: '6px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer'
              }}>
              {label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* บาร์ผลสถิติด้านบน */}
      {!loading && allFiltered.length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center',
          padding: '10px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{allFiltered.length} records matched</span>
          <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 700 }}>{totalW}W</span>
          <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 700 }}>{totalL}L</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>
            Win Rate: <strong style={{ color: wr >= 50 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)' }}>{wr}%</strong>
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: netR >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {netR >= 0 ? '+' : ''}{netR.toFixed(2)}R
          </span>
          {totalLossAmt > 0 && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>
              -${totalLossAmt.toFixed(2)}
            </span>
          )}
          {!isOwner && <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: '0.04em' }}>[Read-Only Archive]</span>}
        </div>
      )}

      {/* แถบตัวกรอง FilterBar ยอดอัจฉริยะ (ใช้ควบคุมร่วมกันทั้งตารางและปฏิทินแบบเรียลไทม์) */}
      <FilterBar
        search={search} setSearch={setSearch}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        filters={filters} setF={setF}
        config={config}
        isOwner={isOwner}
        exportCSV={exportCSV} exporting={exporting}
        handleImportFile={handleImportFile} importing={importing}
      />

      {viewMode === 'list' ? (
        /* มุมมองบัญชีตารางดั้งเดิม */
        <>
          <div className="card" style={{ padding: 0, marginTop: 12 }}>
            {loading ? (
              <div style={{ padding: 24 }}>
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="skeleton skel-line" style={{ marginBottom: 10, width: i % 2 === 0 ? '100%' : '80%' }} />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--t2)' }}>
                <p>No records matching search query found</p>
              </div>
            ) : (
              <TradeTable
                displayed={displayed}
                page={page}
                isOwner={isOwner}
                onEdit={onEdit}
                handleDelete={handleDelete}
                handleQuickResult={handleQuickResult}
                setLightbox={setLightbox}
              />
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700 }} disabled={page === 1} onClick={() => setPage(1)}>FIRST</button>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700 }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>PREV</button>
              <span style={{ fontSize: 12, color: 'var(--t2)', padding: '0 8px', fontWeight: 600 }}>
                Page {page} / {totalPages}
              </span>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700 }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>NEXT</button>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700 }} disabled={page === totalPages} onClick={() => setPage(totalPages)}>LAST</button>
            </div>
          )}
        </>
      ) : (
        /* มุมมองปฏิทินไดนามิก (กรองข้อมูลสดรายเดือน) */
        <div style={{ marginTop: 12 }}>
          <div className="cal-nav" style={{ marginBottom: 12 }}>
            <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700 }} onClick={() => navigateCalendar(-1)}>PREVIOUS</button>
            <span className="cal-month" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{MONTHS[month]} {year}</span>
            <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700 }} onClick={() => navigateCalendar(1)}>NEXT</button>
          </div>

          <CalendarGrid
            year={year}
            month={month}
            firstDay={firstDay}
            daysInMonth={daysInMonth}
            moStr={moStr}
            calMap={calMap}
            todayStrStr={todayStrStr}
            selected={selectedDate}
            handleDayClick={(dateStr) => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
          />

          <DayDetailPanel
            selected={selectedDate}
            selectedData={calMap[selectedDate]}
            loadingDay={false}
            dayTrades={calMap[selectedDate]?.trades || []}
            isOwner={isOwner}
            onEdit={onEdit}
          />
        </div>
      )}

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
      
      <Confirm
        open={!!confirm}
        title={confirm?.title}
        msg={confirm?.msg}
        onYes={confirm?.isImport ? confirmImport : confirmDelete.bind(null, confirm?.id)}
        onNo={() => setConfirm(null)}
        danger={!confirm?.isImport}
      />
    </div>
  )
}