import React, { useState, useEffect } from 'react'
import { Badge, fmtDate } from '../UI'
import CommentSection from './CommentSection'
import { supabase } from '../../lib/supabase'

const inlineLinkStyle = (color = 'var(--green)') => ({
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  font: 'inherit',
  fontSize: '11px',
  fontWeight: '700',
  color: color,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  cursor: 'pointer',
  outline: 'none',
  display: 'inline-block'
})

export default function TradeTable({ displayed, page, isOwner, onEdit, handleDelete, handleQuickResult, setLightbox }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // ── 🌟 แผงเก็บสเตตัสการสไลด์เปิดดูคอมเม้นต์ย่อย (Collapsible Row state) ──
  const [expandedRows, setExpandedRows] = useState([])
  const toggleRow = (id) => setExpandedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12 }}>
        {displayed.map((t, i) => {
          const isExpanded = expandedRows.includes(t.id)
          return (
            <div key={t.id} style={{
              background: 'var(--card)',
              border: t.isDuplicate ? '1px solid var(--yellow)' : '1px solid var(--border)',
              borderRadius: 4,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--t3)' }}>#{(page - 1) * 50 + i + 1}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>{t.pair}</span>
                  <Badge type={t.direction}>{t.direction}</Badge>
                </div>
                <Badge type={t.result || 'Open'}>{t.result || 'OPEN'}</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase' }}>Date</div>
                  <div className="mono" style={{ fontSize: 11, marginTop: 2 }}>{fmtDate(t.trade_date)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase' }}>R:R Ratio</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 2 }}>{t.rr ? `1:${t.rr}` : '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase' }}>Loss ($)</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>{t.loss_amount ? `-$${t.loss_amount}` : '—'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {t.image_link && (
                    <a href={t.image_link} target="_blank" rel="noreferrer" style={inlineLinkStyle('var(--green)')}>Chart</a>
                  )}
                  {t.image_link && t.video_link && <span style={{ color: 'var(--border)' }}>|</span>}
                  {t.video_link && (
                    <a href={t.video_link} target="_blank" rel="noreferrer" style={inlineLinkStyle('var(--green)')}>Video</a>
                  )}
                  {!t.image_link && !t.video_link && <span className="dim">—</span>}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleRow(t.id)} style={inlineLinkStyle('var(--blue)')}>
                    {isExpanded ? 'Hide Discussion' : 'Discussion'}
                  </button>
                  {isOwner && (
                    <>
                      <span>|</span>
                      <button onClick={() => onEdit(t)} style={inlineLinkStyle('var(--text)')}>Edit</button>
                      <span>|</span>
                      <button onClick={() => handleDelete(t.id)} style={inlineLinkStyle('var(--red)')}>Delete</button>
                    </>
                  )}
                </div>
              </div>

              {/* กระทู้สไลด์คอมเม้นสำหรับเวอร์ชัน Mobile */}
              {isExpanded && (
                <CommentSection 
                  tradeId={t.id} 
                  isOwner={isOwner} 
                  isReviewer={!isOwner} 
                  ownerToken={sessionStorage.getItem('tj_owner_token')} 
                  toast={console.log} 
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Date ↓</th><th>Pair</th><th>In / Out</th>
            <th>Sess</th><th>Dir</th><th>Setup</th><th>Entry</th>
            <th>R:R</th><th>Con.L / Loss$</th><th>Result</th>
            <th>Media</th><th>Critique Discuss</th>
            {isOwner && <th></th>}
          </tr>
        </thead>
        <tbody>
          {displayed.map((t, i) => {
            const isExpanded = expandedRows.includes(t.id)
            return (
              <React.Fragment key={t.id}>
                <tr style={{ background: t.isDuplicate ? 'rgba(255,200,87,.03)' : undefined }}>
                  <td className="mono dim" style={{ fontSize: 10 }}>{(page - 1) * 50 + i + 1}</td>

                  <td style={{ fontSize: 11, minWidth: 72 }}>
                    <div className="mono">{fmtDate(t.trade_date)}</div>
                    {t.exit_date && t.exit_date !== t.trade_date && (
                      <div className="mono" style={{ color: 'var(--yellow)', fontSize: 10 }}>→{fmtDate(t.exit_date)}</div>
                    )}
                    {t.isDuplicate && <div style={{ fontSize: 9, color: 'var(--yellow)', fontWeight: 700 }}>DUP</div>}
                  </td>

                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>{t.pair}</td>

                  <td className="mono dim" style={{ fontSize: 10 }}>
                    <div>{t.time_entry || '—'}</div>
                    {t.time_out && <div style={{ color: 'var(--t3)' }}>{t.time_out}</div>}
                  </td>

                  <td><Badge type={t.session}>{t.session || '—'}</Badge></td>
                  <td><Badge type={t.direction}>{t.direction || '—'}</Badge></td>

                  <td style={{ fontSize: 11, color: 'var(--t2)', maxWidth: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.setup_type || '—'}
                  </td>

                  <td className="mono" style={{ fontSize: 11 }}>
                    <div>{t.entry_price || '—'}</div>
                    {t.lot_size && <div style={{ color: 'var(--t3)', fontSize: 10 }}>lot:{t.lot_size}</div>}
                  </td>

                  <td className="mono" style={{ color: 'var(--yellow)', fontSize: 11 }}>{t.rr ? '1:' + t.rr : '—'}</td>

                  <td>
                    {t.con_loss ? <div className="mono neg" style={{ fontSize: 11 }}>{t.con_loss}×</div> : null}
                    {t.loss_amount ? <div style={{ fontSize: 10, color: 'var(--red)' }}>-${t.loss_amount}</div> : null}
                    {!t.con_loss && !t.loss_amount && <span className="dim" style={{ fontSize: 11 }}>—</span>}
                  </td>

                  <td><Badge type={t.result || 'Open'}>{t.result || 'OPEN'}</Badge></td>

                  <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {t.image_link && (
                        <a href={t.image_link} target="_blank" rel="noreferrer" style={{ ...inlineLinkStyle('var(--green)'), textDecoration: 'underline' }}>Chart</a>
                      )}
                      {t.image_link && t.video_link && <span style={{ color: 'var(--border)', fontSize: 10 }}>|</span>}
                      {t.video_link && (
                        <a href={t.video_link} target="_blank" rel="noreferrer" style={{ ...inlineLinkStyle('var(--green)'), textDecoration: 'underline' }}>Video</a>
                      )}
                      {!t.image_link && !t.video_link && <span className="dim">—</span>}
                    </div>
                  </td>

                  {/* ── 🌟 คอลัมน์ควบคุมปุ่มพับขยายกระทู้ความเห็นเจาะลึก ── */}
                  <td>
                    <button onClick={() => toggleRow(t.id)} style={inlineLinkStyle('var(--blue)')}>
                      {isExpanded ? 'Collapse Discussions' : 'View Discussions'}
                    </button>
                  </td>

                  {isOwner && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button onClick={() => onEdit(t)} style={inlineLinkStyle('var(--text)')}>Edit</button>
                      <span style={{ color: 'var(--border)', margin: '0 5px', fontSize: 10 }}>|</span>
                      <button onClick={() => handleDelete(t.id)} style={inlineLinkStyle('var(--red)')}>Delete</button>
                    </td>
                  )}
                </tr>

                {/* ── 🌟 แผงขยายเรนเดอร์ Discussion Thread ใต้แถวเมื่อถูกคลิกเปิด ── */}
                {isExpanded && (
                  <tr>
                    <td colSpan={isOwner ? 14 : 13} style={{ padding: '0 12px 14px 12px', background: 'var(--bg)' }}>
                      <CommentSection 
                        tradeId={t.id} 
                        isOwner={isOwner} 
                        isReviewer={!isOwner} // หากไม่ใช่เจ้าของพอร์ต ยื่นสิทธิ์เขียนตรวจทานให้อาจารย์อัตโนมัติ
                        ownerToken={sessionStorage.getItem('tj_owner_token')} 
                        toast={console.log} 
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}