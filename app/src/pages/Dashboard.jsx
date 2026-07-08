import React, { useState, useMemo } from 'react'
import { usePerformance } from '../hooks/usePerformance'
import { SkeletonStats, Empty } from '../components/UI'
import StatGroup from '../components/dashboard/StatGroup'
import EquityChart from '../components/dashboard/EquityChart'
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const GREEN = '#26D9A0', RED = '#FF5C7A', PURPLE = '#9D7FE8', BLUE = '#5B9FFF', YELLOW = '#FFC857'
const CHART_STYLE = { background: '#12161F', border: '1px solid #222A38', borderRadius: 8, fontSize: 11 }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard({ setPage }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data, loading, ov, wr, totalRR, equityCurve, sessMap, dow, hourly, crossTabStats } = usePerformance()

  if (loading) return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Retrieving statistical datasets…</div>
      <SkeletonStats />
    </div>
  )

  const isNewUser = !data || !ov || !ov.total || ov.total === 0

  if (isNewUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', padding: 20 }}>
        <div className="card" style={{ maxWidth: 440, width: '100%', padding: '36px 24px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            [ Welcome to TradeLog ]
          </div>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 10, color: 'var(--text)' }}>
            Start Your Trading Journey
          </h3>
          <p style={{ color: 'var(--t2)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
            Create an edge by tracking your psychological states, performance statistics, and strategy expectancy. Begin by recording your very first trade execution.
          </p>
          <button 
            onClick={() => { if (setPage) setPage('add'); }}
            className="btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', justifyContent: 'center' }}>
            Log Your First Trade
          </button>
        </div>
      </div>
    )
  }

  const lastEquity = equityCurve.length ? equityCurve[equityCurve.length - 1] : null
  const minDrawdown = equityCurve.length ? Math.min(...equityCurve.map(e => e.y)) : 0
  const maxEquity = equityCurve.length ? Math.max(...equityCurve.map(e => e.y)) : 0
  const ddPct = maxEquity > 0 ? Math.abs(minDrawdown / maxEquity * 100).toFixed(1) : 0

  const dowFull = DAYS.map((d, i) => {
    const found = dow?.find(x => x && x.dow === i)
    return { day: d, win_rate: parseFloat(found?.win_rate) || 0, total: found?.total || 0 }
  })

  // ── 🌟 INSIGHT ENGINE: วิเคราะห์สถิติจับกลุ่มที่ดีที่สุด / แย่ที่สุด ──
  // บังคับสแกนเฉพาะกลุ่มสถิติที่มีปริมาณสะสม (N >= 5) เพื่อความมั่นคงทางตัวเลข ไม่หลอกตาผู้ใช้
  const CONFIDENCE_THRESHOLD = 5 

  const qualifiedInsights = [...crossTabStats]
    .map(x => ({ ...x, expectancy: parseFloat(x.expectancy_r) || 0 }))

  const bestEdge = qualifiedInsights
    .filter(x => x.total_trades >= CONFIDENCE_THRESHOLD && x.expectancy > 0)
    .sort((a, b) => b.expectancy - a.expectancy)[0]

  const worstLeak = qualifiedInsights
    .filter(x => x.total_trades >= CONFIDENCE_THRESHOLD && x.expectancy < 0)
    .sort((a, b) => a.expectancy - b.expectancy)[0]

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Verified ledger stats and diagnostics</div>

      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>
        {[['overview', 'Ledger Overview'], ['analytics', 'Performance Analytics']].map(([id, label]) => (
          <button key={id}
            onClick={() => { setActiveTab(id) }}
            className="btn-ghost"
            style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
              background: activeTab === id ? 'var(--card2)' : 'transparent',
              color: activeTab === id ? 'var(--green)' : 'var(--t2)',
              border: activeTab === id ? '1px solid var(--border)' : '1px solid transparent'
            }}>
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      <StatGroup ov={ov} wr={wr} totalRR={totalRR} />

      {activeTab === 'overview' ? (
        <div className="g2">
          <EquityChart equityCurve={equityCurve} totalRR={totalRR} />

          <div className="card">
            <div className="card-header"><span className="section-title">Session Performance</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Asia', 'London', 'New York'].map(sess => {
                const s = sessMap[sess] || { win: 0, loss: 0, total: 0 }
                const wr2 = s.total > 0 ? Math.round((s.win / s.total) * 100) : 0
                const color = sess === 'Asia' ? PURPLE : sess === 'London' ? BLUE : YELLOW
                return (
                  <div key={sess} className="pair-row">
                    <span className="pair-name" style={{ width: 80 }}>{sess}</span>
                    <div className="bar-wrap"><div className="bar-fill" style={{ width: `${wr2}%`, background: color }} /></div>
                    <span className="pair-stat">{wr2}% ({s.total}T)</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* ================================================================
              🌟 INSIGHT ENGINE DISPLAY (เรนเดอร์สถิติจุดแข็งและรอยรั่วของพอร์ต)
              ================================================================ */}
          <div className="g2">
            {/* โคลนแผงวิเคราะห์จุดเด่น (Best Trading Windows) */}
            <div className="card" style={{ borderLeft: '3px solid var(--green)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Best Profitable Window
              </div>
              {bestEdge ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, fontWeight: 500 }}>
                    Trading <strong style={{ color: 'var(--green)' }}>{bestEdge.pair}</strong> during <strong style={{ color: 'var(--green)' }}>{bestEdge.session} Session</strong> on <strong style={{ color: 'var(--green)' }}>{bestEdge.day_name}s</strong> yields your highest overall expectancy.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Expectancy</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>+{bestEdge.expectancy}R</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Win Rate</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>{bestEdge.win_rate}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Sample Size</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{bestEdge.total_trades} trades</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '8px 0', color: 'var(--t2)' }}>
                  Analyzing historical data... (Accumulate at least {CONFIDENCE_THRESHOLD} trades in any setup/session combo to unlock this insight).
                </div>
              )}
            </div>

            {/* โคลนแผงรอยรั่วพอร์ตลอยตัว (Avoid list / Red Alert) */}
            <div className="card" style={{ borderLeft: '3px solid var(--red)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--red)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                High-Risk Performance Leakage
              </div>
              {worstLeak ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, fontWeight: 500 }}>
                    Executions on <strong style={{ color: 'var(--red)' }}>{worstLeak.pair}</strong> during <strong style={{ color: 'var(--red)' }}>{worstLeak.session} Session</strong> on <strong style={{ color: 'var(--red)' }}>{worstLeak.day_name}s</strong> are currently degrading your portfolio expectancy.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Expectancy</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', marginTop: 2 }}>{worstLeak.expectancy}R</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Win Rate</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', marginTop: 2 }}>{worstLeak.win_rate}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Sample Size</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{worstLeak.total_trades} trades</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '8px 0', color: 'var(--t2)' }}>
                  No severe performance leakage detected. Keep maintaining high consistency parameters!
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="section-title">Risk & Drawdown diagnostics</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 10 }}>
              {[
                ['Peak Equity Level', maxEquity + 'R', GREEN],
                ['Current Level', (lastEquity?.y || 0) + 'R', (lastEquity?.y || 0) >= 0 ? GREEN : RED],
                ['Maximum Drawdown Recorded', minDrawdown + 'R', RED],
                ['Drawdown from Peak Ratio', ddPct + '%', RED],
              ].map(([lbl, val, col]) => (
                <div key={lbl} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{lbl}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: col, marginTop: 4 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="g2">
            <div className="card">
              <div className="card-header"><span className="section-title">Performance by Day of Week</span></div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={dowFull} margin={{ top: 0, right: 4, left: -28, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#7B8299' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#7B8299' }} domain={[0, 100]} />
                  <Tooltip contentStyle={CHART_STYLE} formatter={v => [v + '%', 'Win Rate']} />
                  <Bar dataKey="win_rate" radius={[4, 4, 0, 0]}>
                    {dowFull.map((d, i) => (
                      <Cell key={i} fill={parseFloat(d.win_rate) >= 50 ? GREEN : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-header"><span className="section-title">Expectancy by Entry Hour</span></div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={hourly} margin={{ top: 0, right: 4, left: -28, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#7B8299' }} tickFormatter={h => `${String(h).padStart(2, '0')}h`} />
                  <YAxis hide />
                  <Tooltip contentStyle={CHART_STYLE} formatter={v => [v + '% Win Rate']} />
                  <Bar dataKey="win_rate" radius={[3, 3, 0, 0]}>
                    {hourly.map((h, i) => {
                      const sess = h.hour >= 1 && h.hour < 8 ? PURPLE : h.hour >= 8 && h.hour < 16 ? BLUE : YELLOW
                      return <Cell key={i} fill={sess} opacity={parseFloat(h.win_rate) >= 50 ? 1 : 0.5} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}