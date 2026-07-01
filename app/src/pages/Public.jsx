import React, { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboardStats } from '../lib/api'
import { Badge, Empty, fmtDate, fmtRR } from '../components/UI'

const GREEN = '#26D9A0', RED = '#FF5C7A'

export default function Public({ toast }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    getDashboardStats().then(setData).catch(e => toast(e.message, 'error'))
  }, [])

  if (!data) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--t2)' }}>Loading…</div>
  )

  const ov = data.overall
  const wr = parseFloat(ov?.win_rate) || 0
  const totalRR = parseFloat(ov?.total_rr) || 0

  const equityCurve = [...(data.recent || [])].reverse().reduce((acc, t) => {
    const prev = acc.length ? acc[acc.length - 1].y : 0
    const delta = t.result === 'Win' ? (parseFloat(t.rr) || 1) : t.result === 'Loss' ? -1 : 0
    acc.push({ x: acc.length + 1, y: +(prev + delta).toFixed(2) })
    return acc
  }, [])

  const wrColor = wr >= 60 ? GREEN : wr >= 45 ? '#FFC857' : RED

  return (
    <div>
      {/* Hero */}
      <div className="pub-hero">
        <div style={{ fontSize: 30, marginBottom: 4 }}>◈</div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>
          Trade Journal
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: 14 }}>Public Performance Record · Read-only</p>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        {[
          { label: 'Win Rate', val: wr + '%', color: wr >= 60 ? 'green' : wr >= 45 ? 'yellow' : 'red', sub: `${ov.win}W · ${ov.loss}L · ${ov.miss}M` },
          { label: 'Total Trades', val: ov.total, color: 'blue', sub: 'All time' },
          { label: 'Net R', val: fmtRR(totalRR), color: totalRR >= 0 ? 'green' : 'red', sub: 'Cumulative R:R' },
          { label: 'Max Con. Loss', val: ov.max_con_loss, color: 'red', sub: 'Streak' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.color}`}>{s.val}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="g2">
        {/* Equity */}
        <div className="card">
          <div className="card-header">
            <span className="section-title">Equity Curve</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: totalRR >= 0 ? GREEN : RED }}>{fmtRR(totalRR)}</span>
          </div>
          {equityCurve.length > 1 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={equityCurve} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="pubGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={totalRR >= 0 ? GREEN : RED} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={totalRR >= 0 ? GREEN : RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="x" hide />
                <YAxis tick={{ fontSize: 10, fill: '#7B8299' }} />
                <Tooltip contentStyle={{ background: '#12161F', border: '1px solid #222A38', borderRadius: 8, fontSize: 12 }}
                  formatter={v => [fmtRR(v), 'Equity']} labelFormatter={() => ''} />
                <Area dataKey="y" stroke={totalRR >= 0 ? GREEN : RED} strokeWidth={2}
                  fill="url(#pubGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty text="Not enough data yet" />}
        </div>

        {/* By pair */}
        <div className="card">
          <div className="card-header"><span className="section-title">By Pair</span></div>
          {data.byPair.map(p => {
            const wr2 = parseFloat(p.win_rate) || 0
            const col = wr2 >= 60 ? GREEN : wr2 >= 45 ? '#FFC857' : RED
            return (
              <div key={p.pair} className="pair-row" style={{ marginBottom: 8 }}>
                <span className="pair-name">{p.pair}</span>
                <div className="bar-wrap">
                  <div className="bar-fill" style={{ width: `${wr2}%`, background: col }} />
                </div>
                <span className="pair-stat">{wr2}% ({p.total})</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent trades with media */}
      <div className="card">
        <div className="card-header"><span className="section-title">Recent Trades</span></div>
        {data.recent.length === 0 ? <Empty text="No trades yet" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Pair</th><th>Session</th><th>Setup</th><th>R:R</th><th>Result</th><th>Chart</th><th>Video</th></tr>
              </thead>
              <tbody>
                {data.recent.slice(0, 30).map(t => (
                  <tr key={t.id}>
                    <td className="mono dim" style={{ fontSize: 12 }}>{fmtDate(t.trade_date)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>{t.pair}</td>
                    <td><Badge type={t.session}>{t.session}</Badge></td>
                    <td style={{ fontSize: 11, color: 'var(--t2)' }}>{t.setup_type || '—'}</td>
                    <td className="mono" style={{ color: '#FFC857', fontSize: 12 }}>{t.rr ? '1:' + t.rr : '—'}</td>
                    <td><Badge type={t.result}>{t.result}</Badge></td>
                    <td>
                      {t.image_link
                        ? <a href={t.image_link} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontSize: 12 }}>🖼 View</a>
                        : <span className="dim">—</span>}
                    </td>
                    <td>
                      {t.video_link
                        ? <a href={t.video_link} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontSize: 12 }}>▶ Watch</a>
                        : <span className="dim">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}