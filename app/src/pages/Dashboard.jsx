import React, { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { getDashboardStats } from '../lib/api'
import { Badge, SkeletonStats, Empty, CountUp, fmtDate, fmtRR } from '../components/UI'

const GREEN = '#26D9A0', RED = '#FF5C7A', YELLOW = '#FFC857', BLUE = '#5B9FFF', PURPLE = '#9D7FE8'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Loading…</div>
      <SkeletonStats />
      <div className="g2">
        {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 10 }} />)}
      </div>
    </div>
  )

  if (!data) return <Empty icon="⚠️" text="Failed to load data. Check your Supabase connection." />

  const ov = data.overall
  const wr = parseFloat(ov?.win_rate) || 0
  const wrColor = wr >= 60 ? GREEN : wr >= 45 ? YELLOW : RED
  const totalRR = parseFloat(ov?.total_rr) || 0

  // Build equity curve from recent trades (oldest→newest cumulative R)
  const equityCurve = [...(data.recent || [])]
    .reverse()
    .reduce((acc, t) => {
      const prev = acc.length ? acc[acc.length - 1].y : 0
      const delta = t.result === 'Win' ? (parseFloat(t.rr) || 1) : t.result === 'Loss' ? -1 : 0
      acc.push({ x: acc.length + 1, y: +(prev + delta).toFixed(2), result: t.result })
      return acc
    }, [])

  const sessionOrder = ['Asia', 'London', 'New York']
  const sessionMap = {}
  data.bySession.forEach(s => { sessionMap[s.session] = s })

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Overall performance — all pairs combined</div>

      {/* Stat cards */}
      <div className="stats-row">
        <StatCard label="Win Rate" color="green" sub={`${ov.win}W · ${ov.loss}L · ${ov.miss}M`}>
          <span style={{ color: wrColor }}>
            <CountUp value={wr} suffix="%" decimals={1} />
          </span>
        </StatCard>
        <StatCard label="Total Trades" color="blue" sub="All pairs combined">
          <span style={{ color: BLUE }}><CountUp value={ov.total} /></span>
        </StatCard>
        <StatCard label="Net R" color={totalRR >= 0 ? 'green' : 'red'} sub="Cumulative R:R">
          <span style={{ color: totalRR >= 0 ? GREEN : RED }}>
            {totalRR >= 0 ? '+' : ''}<CountUp value={totalRR} decimals={2} />R
          </span>
        </StatCard>
        <StatCard label="Max Con. Loss" color="red" sub="Consecutive losses">
          <span style={{ color: RED }}><CountUp value={ov.max_con_loss} /></span>
        </StatCard>
      </div>

      {/* Equity curve + Session */}
      <div className="g2">
        <div className="card">
          <div className="card-header">
            <span className="section-title">Equity Curve (R)</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: totalRR >= 0 ? GREEN : RED }}>
              {fmtRR(totalRR)}
            </span>
          </div>
          {equityCurve.length > 1 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={equityCurve} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={totalRR >= 0 ? GREEN : RED} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={totalRR >= 0 ? GREEN : RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="x" hide />
                <YAxis tick={{ fontSize: 10, fill: '#7B8299' }} />
                <Tooltip
                  contentStyle={{ background: '#12161F', border: '1px solid #222A38', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [fmtRR(v), 'Equity']}
                  labelFormatter={() => ''}
                />
                <Area dataKey="y" stroke={totalRR >= 0 ? GREEN : RED} strokeWidth={2}
                  fill="url(#eqGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty text="Add more trades to see the curve" />}
        </div>

        {/* By session */}
        <div className="card">
          <div className="card-header"><span className="section-title">By Session</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessionOrder.map(sess => {
              const s = sessionMap[sess] || { win: 0, loss: 0, total: 0 }
              const wr2 = s.total > 0 ? Math.round(s.win / s.total * 100) : 0
              const color = sess === 'Asia' ? PURPLE : sess === 'London' ? BLUE : YELLOW
              return (
                <div key={sess} className="pair-row">
                  <span className="pair-name" style={{ width: 76 }}>{sess}</span>
                  <div className="bar-wrap">
                    <div className="bar-fill" style={{ width: `${wr2}%`, background: color }} />
                  </div>
                  <span className="pair-stat">{wr2}% ({s.win}/{s.total})</span>
                </div>
              )
            })}
          </div>

          {/* By direction */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['Buy', 'Sell'].map(dir => {
              const d = data.bySession // we'll compute from recent
              const trades = data.recent.filter(t => t.direction === dir)
              const w = trades.filter(t => t.result === 'Win').length
              const tot = trades.filter(t => t.result !== 'Miss').length
              const wr3 = tot ? Math.round(w / tot * 100) : 0
              return (
                <div key={dir} style={{
                  background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 4 }}>{dir.toUpperCase()}</div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 700, color: dir === 'Buy' ? GREEN : RED }}>
                    {wr3}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                    {w}W / {tot - w}L ({trades.length})
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* By pair + By setup */}
      <div className="g2">
        <div className="card">
          <div className="card-header"><span className="section-title">By Pair</span></div>
          {data.byPair.length === 0 ? <Empty text="No data" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.byPair.map(p => {
                const wr2 = parseFloat(p.win_rate) || 0
                const color = wr2 >= 60 ? GREEN : wr2 >= 45 ? YELLOW : RED
                return (
                  <div key={p.pair} className="pair-row">
                    <span className="pair-name">{p.pair}</span>
                    <div className="bar-wrap">
                      <div className="bar-fill" style={{ width: `${wr2}%`, background: color }} />
                    </div>
                    <span className="pair-stat">{wr2}% ({p.total})</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="section-title">By Setup</span></div>
          {data.bySetup.length === 0 ? <Empty text="No data" /> : (
            <div style={{ overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.bySetup.slice(0, 8)} layout="vertical"
                  margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="setup_type" type="category" tick={{ fontSize: 11, fill: '#7B8299' }} width={90} />
                  <Tooltip
                    contentStyle={{ background: '#12161F', border: '1px solid #222A38', borderRadius: 8, fontSize: 12 }}
                    formatter={(v, name) => [v, name === 'win' ? 'Win' : 'Loss']}
                  />
                  <Bar dataKey="win" fill={GREEN} radius={[0, 3, 3, 0]} barSize={10} />
                  <Bar dataKey="loss" fill={RED} radius={[0, 3, 3, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent trades */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">Recent Trades</span>
          <span style={{ fontSize: 11, color: 'var(--t2)' }}>{data.recent.length} loaded</span>
        </div>
        {data.recent.length === 0 ? <Empty text="No trades yet — add your first trade!" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Pair</th><th>Dir</th><th>Setup</th>
                  <th>Session</th><th>R:R</th><th>Con.L</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.slice(0, 15).map(t => (
                  <tr key={t.id}>
                    <td className="mono dim" style={{ fontSize: 12 }}>{fmtDate(t.trade_date)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>{t.pair}</td>
                    <td><Badge type={t.direction}>{t.direction}</Badge></td>
                    <td style={{ fontSize: 12, color: 'var(--t2)' }}>{t.setup_type || '—'}</td>
                    <td><Badge type={t.session}>{t.session}</Badge></td>
                    <td className="mono" style={{ color: YELLOW, fontSize: 12 }}>{t.rr ? '1:' + t.rr : '—'}</td>
                    <td className="mono neg" style={{ fontSize: 12 }}>{t.con_loss || ''}</td>
                    <td><Badge type={t.result}>{t.result}</Badge></td>
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

function StatCard({ label, color, sub, children }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{children}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}