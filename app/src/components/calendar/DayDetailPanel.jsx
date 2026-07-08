import React from 'react'
import { Badge, fmtDate } from '../UI'

export default function DayDetailPanel({
  selected,
  selectedData,
  loadingDay,
  dayTrades,
  isOwner,
  onEdit
}) {
  if (!selected || !selectedData) return null

  const isPositive = parseFloat(selectedData.net_rr) >= 0

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="card-header">
        <span className="section-title">
          {new Date(selected + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
          color: isPositive ? 'var(--green)' : 'var(--red)'
        }}>
          {isPositive ? '+' : ''}{selectedData.net_rr}R
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          { label: 'Trades', val: selectedData.total, color: 'var(--text)' },
          { label: 'Win', val: selectedData.win, color: 'var(--green)' },
          { label: 'Loss', val: selectedData.loss, color: 'var(--red)' },
          { label: 'Miss', val: selectedData.miss, color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {loadingDay ? (
        <div style={{ padding: 16 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton skel-line" style={{ marginBottom: 8 }} />
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th><th>Pair</th><th>Dir</th><th>Setup</th>
                <th>Entry</th><th>R:R</th><th>Result</th><th>Media</th>
                {isOwner && <th></th>}
              </tr>
            </thead>
            <tbody>
              {dayTrades.map(t => (
                <tr key={t.id}>
                  <td className="mono dim" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    {t.time_entry || '—'}
                    {t.time_out && <> → {t.time_out}</>}
                    {t.exit_date && t.exit_date !== t.trade_date && (
                      <div style={{ fontSize: 10, color: 'var(--yellow)' }}>→ {fmtDate(t.exit_date)}</div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>{t.pair}</td>
                  <td><Badge type={t.direction}>{t.direction}</Badge></td>
                  <td style={{ fontSize: 11, color: 'var(--t2)' }}>{t.setup_type || '—'}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{t.entry_price || '—'}</td>
                  <td className="mono" style={{ color: 'var(--yellow)', fontSize: 11 }}>
                    {t.rr ? '1:' + t.rr : '—'}
                  </td>
                  <td><Badge type={t.result}>{t.result}</Badge></td>
                  {/* ถอดอีโมจิรูปภาพและปุ่มวาดรูปออก แทนที่ด้วยปุ่มข้อความคลีน */}
                  <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                    {t.image_link && (
                      <a href={t.image_link} target="_blank" rel="noreferrer"
                         style={{ marginRight: 6, fontWeight: 700, color: 'var(--green)', textDecoration: 'none' }}>Chart</a>
                    )}
                    {t.video_link && (
                      <a href={t.video_link} target="_blank" rel="noreferrer"
                         style={{ fontWeight: 700, color: 'var(--green)', textDecoration: 'none' }}>Video</a>
                    )}
                    {!t.image_link && !t.video_link && <span style={{ color: 'var(--t3)' }}>—</span>}
                  </td>
                  {isOwner && (
                    <td>
                      <button className="btn-link" style={{ fontSize: 11, fontWeight: 700 }}
                        onClick={() => onEdit && onEdit(t)} title="Edit">Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dayTrades.some(t => (t.tags || []).length > 0 || t.notes) && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {dayTrades.filter(t => (t.tags || []).length > 0).map(t => (
            <div key={t.id} style={{ fontSize: 11, color: 'var(--purple)', marginBottom: 4 }}>
              <span style={{ color: 'var(--t3)' }}>{t.pair} tags:</span> {t.tags.join(', ')}
            </div>
          ))}
          {dayTrades.filter(t => t.notes).map(t => (
            <div key={t.id} style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>
              <span style={{ color: 'var(--t3)', fontFamily: 'var(--mono)', fontSize: 11 }}>{t.pair}:</span> {t.notes}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}