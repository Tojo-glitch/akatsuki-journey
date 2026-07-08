import React from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// บังคับสมมาตรระดับมิลลิเมตรด้วย CSS Grid ตัวแปรสากล
const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '6px',
  width: '100%',
  boxSizing: 'border-box'
}

export default function CalendarGrid({
  year,
  month,
  firstDay,
  daysInMonth,
  moStr,
  calMap,
  todayStrStr,
  selected,
  handleDayClick
}) {
  return (
    <div className="card" style={{ padding: '16px' }}>
      {/* จัดเรียงหัวข้อวันอาทิตย์-เสาร์ ให้กว้างเท่ากันอย่างสมมาตร */}
      <div style={{ ...gridContainerStyle, marginBottom: 8 }}>
        {DAYS.map(d => (
          <div key={d} className="cal-day-name" style={{ 
            textAlign: 'center', 
            fontSize: 11, 
            fontWeight: 700, 
            color: 'var(--t3)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* จัดเรียงช่องปฏิทินรายวันให้เท่ากันอย่างไร้รอยเหลื่อมล้ำ */}
      <div style={gridContainerStyle}>
        {/* ช่องว่างสำหรับวันเริ่มต้นของเดือน */}
        {[...Array(firstDay)].map((_, i) => (
          <div key={`empty-${i}`} className="cal-day empty" style={{ minHeight: '60px' }} />
        ))}
        
        {/* ช่องตัวเลขวันปกติ */}
        {[...Array(daysInMonth)].map((_, i) => {
          const d = i + 1
          const k = `${year}-${moStr}-${String(d).padStart(2, '0')}`
          const dc = calMap[k]
          const hasData = dc && dc.total > 0
          const isToday = k === todayStrStr
          const isSel = k === selected
          const rr = dc ? parseFloat(dc.net_rr) : null

          return (
            <div key={d}
              className={`cal-day ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''} ${(!dc || dc.total === 0) ? 'empty-day' : ''}`}
              style={{
                borderColor: isSel ? 'var(--blue)' : isToday ? 'rgba(38,217,160,.5)' : undefined,
                background: isSel ? 'rgba(91,159,255,.07)' : undefined,
                cursor: hasData ? 'pointer' : 'default',
                minHeight: '60px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '6px',
                boxSizing: 'border-box'
              }}
              onClick={() => handleDayClick(k, dc)}>
              
              <div className="cal-dn" style={{ 
                color: isToday ? 'var(--green)' : undefined,
                fontSize: 11,
                fontWeight: 700
              }}>{d}</div>
              
              {hasData && (
                <div style={{ marginTop: 'auto' }}>
                  <div className="cal-rr" style={{
                    color: rr > 0 ? 'var(--green)' : rr < 0 ? 'var(--red)' : 'var(--t2)',
                    fontSize: 10,
                    fontWeight: 700,
                    textAlign: 'right'
                  }}>
                    {rr > 0 ? '+' : ''}{rr}R
                  </div>
                  <div className="cal-dots" style={{ display: 'flex', gap: '2px', marginTop: '2px', justifyContent: 'flex-end' }}>
                    {[...Array(Math.min(dc.win || 0, 4))].map((_, j) => <div key={`w-${j}`} className="cdot w" />)}
                    {[...Array(Math.min(dc.loss || 0, 4))].map((_, j) => <div key={`l-${j}`} className="cdot l" />)}
                    {[...Array(Math.min(dc.miss || 0, 2))].map((_, j) => <div key={`m-${j}`} className="cdot m" />)}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}