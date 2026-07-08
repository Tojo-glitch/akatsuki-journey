import React, { useState, useRef } from 'react'

export default function FilterBar({
  search, setSearch,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  filters, setF,
  config,
  isOwner,
  exportCSV, exporting,
  handleImportFile, importing
}) {
  const fileRef = useRef(null)
  
  // สถานะควบแน่นตัวกรอง ซ่อนฟิลเตอร์ย่อยเพื่อคืนสเปซตาราง
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ marginBottom: 12 }}>
      {/* ส่วนควบคุมภายนอกหลัก (แสดงผลตลอดเวลาเพื่อความว่องไวในการค้นหา) */}
      <div className="filter-bar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by pair, setup, tag or notes..."
          style={{ minWidth: 180, flex: 1 }} />
        
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          title="From date" style={{ maxWidth: 130 }} />
        
        <span style={{ color: 'var(--text-dim)', fontSize: 11, alignSelf: 'center', fontWeight: 700 }}>TO</span>
        
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          title="To date" style={{ maxWidth: 130 }} />

        {(dateFrom || dateTo) && (
          <button className="btn-ghost" style={{ fontSize: 11, padding: '8px 12px', fontWeight: 700 }}
            onClick={() => { setDateFrom(''); setDateTo('') }}>Clear Date</button>
        )}

        {/* ปุ่มควบคุม ยุบ/ขยาย แผงตัวกรองเชิงลึก */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="btn-ghost" 
          style={{ 
            fontSize: 11, 
            padding: '8px 14px', 
            fontWeight: 700, 
            color: isOpen ? 'var(--green)' : 'var(--text)',
            border: isOpen ? '1px solid var(--green)' : '1px solid var(--border)'
          }}>
          {isOpen ? 'HIDE OPTIONS' : 'FILTER OPTIONS'}
        </button>
      </div>

      {/* แผงดรอปดาวน์ภายในตู้สไลด์ (Drawer Panel) เปิดเรนเดอร์ย่อยเฉพาะเมื่อกดปลดล็อก */}
      {isOpen && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          padding: '14px 16px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          marginTop: 6
        }}>
          <div>
            <label className="form-label" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>Asset Pair</label>
            <select value={filters.pair} onChange={e => setF('pair', e.target.value)} style={{ width: '100%' }}>
              <option value="all">All Pairs</option>
              {config.pairs.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>Outcome Result</label>
            <select value={filters.result} onChange={e => setF('result', e.target.value)}>
              <option value="all">All Results</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="Miss">Miss</option>
              <option value="Open">Open</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 10, marginBottom: 4, textTransform: 'uppercase' }}>Trading Session</label>
            <select value={filters.session} onChange={e => setF('session', e.target.value)}>
              <option value="all">All Sessions</option>
              <option>Asia</option><option>London</option><option value="New York">New York</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 10, marginBottom: 4, textTransform: 'uppercase' }}>Execution Setup</label>
            <select value={filters.setup} onChange={e => setF('setup', e.target.value)}>
              <option value="all">All Setups</option>
              {config.setupTypes.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* แผงยิงส่งออก/นำเข้าข้อมูลในตู้เก็บตัวกรอง */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
            <button className="btn-primary" style={{ fontSize: 10, height: '34px', padding: '0 12px' }} onClick={exportCSV} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            {isOwner && (
              <>
                <button className="btn-ghost" style={{ fontSize: 10, height: '34px', padding: '0 12px' }}
                  onClick={() => fileRef.current?.click()} disabled={importing}>
                  {importing ? 'Importing…' : 'Import CSV'}
                </button>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportFile} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}