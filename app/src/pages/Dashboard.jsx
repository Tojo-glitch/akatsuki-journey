import React, { useState, useMemo, useEffect } from 'react'
import { usePerformance } from '../hooks/usePerformance'
import { SkeletonStats, Empty, Badge, fmtDate, fmtRR } from '../components/UI'
import StatGroup from '../components/dashboard/StatGroup'
import EquityChart from '../components/dashboard/EquityChart'
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line, Legend } from 'recharts'

const GREEN = '#26D9A0', RED = '#FF5C7A', PURPLE = '#9D7FE8', BLUE = '#5B9FFF', YELLOW = '#FFC857'
const CHART_STYLE = { background: '#12161F', border: '1px solid #222A38', borderRadius: 8, fontSize: 11 }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard({ setPage }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const { 
    data, loading, ov, wr, totalRR, sessMap, dow, hourly, 
    crossTabStats, pairIntelligence, tagAnalysis, conLossDetail, 
    equityDrawdownData, staleHygieneCount, streakDays, adherenceScore,
    monthlyTrend, setupSessionExpectancy, rDistribution,
    period, setPeriod, equityCurve
  } = usePerformance()

  // กำหนดตัวแปรระบบไว้ส่วนบนสุดของฟังก์ชันเพื่อความเสถียร
  const showHygieneWarning = staleHygieneCount > 0
  const isNewUser = !data || !ov || !ov.total || ov.total === 0

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (loading) return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Retrieving statistical datasets…</div>
      <SkeletonStats />
    </div>
  )

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

  // ── 🌟 [ซ่อมแซมจุดแปรปรวน]: จัดเรียงสัญศาสตร์สีและตัวแปร Drawdown ให้ตรงกันเป๊ะตามหลักวิชาการ ──
  const lastEquity = equityDrawdownData.length ? equityDrawdownData[equityDrawdownData.length - 1] : null
  const minDrawdown = equityDrawdownData.length ? Math.min(...equityDrawdownData.map(e => parseFloat(e.drawdown))) : 0
  const maxEquity = equityDrawdownData.length ? Math.max(...equityDrawdownData.map(e => parseFloat(e.equity))) : 0
  const ddPct = maxEquity > 0 ? Math.abs(minDrawdown / maxEquity * 100).toFixed(1) : 0

  const dowFull = DAYS.map((d, i) => {
    const found = dow?.find(x => x && x.dow === i)
    return { day: d, win_rate: parseFloat(found?.win_rate) || 0, total: found?.total || 0 }
  })

  const CONFIDENCE_THRESHOLD = 5 
  const qualifiedInsights = [...crossTabStats].map(x => ({ ...x, expectancy: parseFloat(x.expectancy_r) || 0 }))
  const bestEdge = qualifiedInsights.filter(x => x.total_trades >= CONFIDENCE_THRESHOLD && x.expectancy > 0).sort((a, b) => b.expectancy - a.expectancy)[0]
  const worstLeak = qualifiedInsights.filter(x => x.total_trades >= CONFIDENCE_THRESHOLD && x.expectancy < 0).sort((a, b) => a.expectancy - b.expectancy)[0]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Verified ledger stats and diagnostics</div>
        </div>

        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          {[
            ['all', 'All Time'],
            ['30d', '30 Days'],
            ['mtd', 'This Month']
          ].map(([id, label]) => (
            <button key={id}
              onClick={() => setPeriod(id)}
              style={{
                background: period === id ? 'var(--card2)' : 'transparent',
                color: period === id ? 'var(--green)' : 'var(--text-dim)',
                border: 'none', padding: '6px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer'
              }}>
              {label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {showHygieneWarning && (
        <div style={{
          background: 'rgba(255, 92, 122, 0.04)', border: '1px dashed var(--red)',
          color: 'var(--red)', padding: '12px 16px', borderRadius: 4, marginBottom: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.01em' }}>
            Data Hygiene Warning: Found {staleHygieneCount} abandoned positions older than 7 days. Keeping these open degrades overall statistical win rate and expectancy accuracy.
          </span>
          <button 
            onClick={() => { if (setPage) setPage('settings'); }}
            className="btn-ghost" 
            style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, borderColor: 'var(--red)', color: 'var(--red)' }}
          >
            GO TO SYSTEM HYGIENE CENTER
          </button>
        </div>
      )}

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

      <StatGroup 
        ov={ov} 
        wr={wr} 
        totalRR={totalRR} 
        streakDays={streakDays} 
        adherenceScore={adherenceScore} 
      />

      {activeTab === 'overview' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          <div className="g2">
            <div className="card">
              <div className="card-header"><span className="section-title">Performance by Asset Pair</span></div>
              {(!data.byPair || data.byPair.length === 0) ? <Empty text="No assets logged" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.byPair.map(p => {
                    const wr2 = parseFloat(p.win_rate) || 0
                    const col = wr2 >= 55 ? GREEN : wr2 >= 45 ? YELLOW : RED
                    return (
                      <div key={p.pair} className="pair-row">
                        <span className="pair-name" style={{ width: 72 }}>{p.pair}</span>
                        <div className="bar-wrap"><div className="bar-fill" style={{ width: `${wr2}%`, background: col }} /></div>
                        <span className="pair-stat">{wr2}% ({p.total}T)</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header"><span className="section-title">Performance by Strategy Setup</span></div>
              {(!data.bySetup || data.bySetup.length === 0) ? <Empty text="No setups logged" /> : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Strategy Setup</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bySetup.slice(0, 5).map(s => {
                        const wr2 = s.total > 0 ? Math.round((s.win / s.total) * 100) : 0
                        return (
                          <tr key={s.setup_type}>
                            <td className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{s.setup_type}</td>
                            <td style={{ color: GREEN }}>{s.win}</td>
                            <td style={{ color: RED }}>{s.loss}</td>
                            <td className="mono" style={{ color: wr2 >= 50 ? GREEN : RED, fontWeight: 700 }}>{wr2}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="section-title">Monthly Expectancy Velocity & Learning Curve</span></div>
            {monthlyTrend.length === 0 ? <Empty text="Not enough historical data" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                  <XAxis dataKey="month_label" tick={{ fontSize: 10, fill: '#7B8299' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#7B8299' }} />
                  <Tooltip contentStyle={CHART_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 10, marginTop: 10 }} />
                  <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="net_r" name="Net Monthly Profit (R)" stroke={GREEN} strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="win_rate" name="Monthly Win Rate (%)" stroke={BLUE} strokeWidth={1.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '16px 18px 8px 18px', marginBottom: 0 }}>
              <span className="section-title">Recent Transactions Preview</span>
            </div>
            {data.recent.length === 0 ? <Empty text="No trades recorded yet" /> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Asset Pair</th>
                      <th>Direction</th>
                      <th>Setup</th>
                      <th>Session</th>
                      <th>R:R Ratio</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.slice(0, 10).map(t => (
                      <tr key={t.id}>
                        <td className="mono dim" style={{ fontSize: 11 }}>{fmtDate(t.trade_date)}</td>
                        <td className="mono" style={{ fontWeight: 700 }}>{t.pair}</td>
                        <td><Badge type={t.direction}>{t.direction}</Badge></td>
                        <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>{t.setup_type || '—'}</td>
                        <td><Badge type={t.session}>{t.session}</Badge></td>
                        <td className="mono" style={{ color: YELLOW }}>{t.rr ? `1:${t.rr}` : '—'}</td>
                        <td><Badge type={t.result || 'Open'}>{t.result || 'OPEN'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Performance Analytics Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <div className="g2">
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
                  Analyzing data... (Accumulate at least {CONFIDENCE_THRESHOLD} trades in any setup/session combo to unlock this insight).
                </div>
              )}
            </div>

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
            <div className="card-header"><span className="section-title">Institutional Quant Metrics</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                ['Profit Factor Ratio', (ov.profit_factor || '0.00') + '×', parseFloat(ov.profit_factor) >= 1.5 ? GREEN : RED, 'Expectancy ratio vs losses (>1.5 is elite)'],
                ['Average Win Size', (ov.avg_win_r || '0.00') + 'R', GREEN, 'Your average winning execution target scale'],
                ['Average Loss Size', '-' + (ov.avg_loss_r || '0.00') + 'R', RED, 'Your average losing stopout deviation']
              ].map(([lbl, val, col, sub]) => (
                <div key={lbl} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{lbl}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: col, marginTop: 4 }}>{val}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dark)', marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="section-title">R-Multiple Distribution Histogram</span>
            </div>
            {rDistribution.length === 0 ? <Empty text="Not enough trades to map distribution matrix" /> : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={rDistribution} margin={{ top: 10, right: 10, left: -28, bottom: 0 }}>
                  <XAxis dataKey="r_label" tick={{ fontSize: 10, fill: '#7B8299' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#7B8299' }} />
                  <Tooltip contentStyle={CHART_STYLE} formatter={v => [v + ' trades', 'Frequency']} />
                  <Bar dataKey="total_trades_frequency" fill={GREEN} radius={[4, 4, 0, 0]}>
                    {rDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={parseFloat(entry.r_bucket) < 0 ? RED : GREEN} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '16px 18px 8px 18px', marginBottom: 0 }}>
              <span className="section-title">Setup Strategy × Session Expectancy Synergy Matrix</span>
            </div>
            {setupSessionExpectancy.length === 0 ? <Empty text="Combine setup strategy and times to compile synergy metrics" /> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Strategy Setup</th>
                      <th>Market Session</th>
                      <th>Total Samples</th>
                      <th>Strategy Win Rate</th>
                      <th>Session Expectancy (R)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setupSessionExpectancy.map((s, idx) => {
                      const expCol = parseFloat(s.expectancy_r) >= 0 ? GREEN : RED
                      return (
                        <tr key={idx}>
                          <td className="mono" style={{ fontWeight: 800 }}>{s.setup_type}</td>
                          <td><Badge type={s.session}>{s.session}</Badge></td>
                          <td className="mono">{s.total_trades} trades</td>
                          <td className="mono" style={{ color: parseFloat(s.win_rate) >= 50 ? GREEN : RED, fontWeight: 700 }}>{s.win_rate}%</td>
                          <td className="mono" style={{ color: expCol, fontWeight: 800 }}>{parseFloat(s.expectancy_r) >= 0 ? '+' : ''}{s.expectancy_r}R</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '16px 18px 8px 18px', marginBottom: 0 }}>
              <span className="section-title">Asset Intelligence & Symmetrical Holding Metrics</span>
            </div>
            {pairIntelligence.length === 0 ? <Empty text="No statistical holding data recorded yet" /> : (
              isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14 }}>
                  {pairIntelligence.map(p => {
                    const col = p.expectancy_r >= 0 ? GREEN : RED
                    return (
                      <div key={p.pair} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="mono" style={{ fontWeight: 800, fontSize: 13 }}>{p.pair}</span>
                          <span className="mono" style={{ color: p.win_rate >= 50 ? GREEN : RED, fontWeight: 700 }}>{p.win_rate}% Win Rate</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                          <div>
                            <span style={{ color: 'var(--t2)' }}>Avg Hold Time</span>
                            <div className="mono" style={{ fontWeight: 700, marginTop: 2 }}>{p.avg_holding_duration}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--t2)' }}>Expectancy</span>
                            <div className="mono" style={{ color: col, fontWeight: 700, marginTop: 2 }}>{p.expectancy_r}R</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10, color: 'var(--t3)' }}>
                          <div>Win Hold: <strong style={{ color: GREEN }}>{p.avg_win_duration}</strong></div>
                          <div>Loss Hold: <strong style={{ color: RED }}>{p.avg_loss_duration}</strong></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Asset Pair</th>
                        <th>Win Rate</th>
                        <th>Expectancy (R)</th>
                        <th>Average Hold Duration</th>
                        <th>Average Win Duration</th>
                        <th>Average Loss Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pairIntelligence.map(p => {
                        const col = p.expectancy_r >= 0 ? GREEN : RED
                        return (
                          <tr key={p.pair}>
                            <td className="mono" style={{ fontWeight: 800 }}>{p.pair}</td>
                            <td className="mono" style={{ color: p.win_rate >= 50 ? GREEN : RED, fontWeight: 700 }}>{p.win_rate}%</td>
                            <td className="mono" style={{ color: col, fontWeight: 700 }}>{p.expectancy_r > 0 ? '+' : ''}{p.expectancy_r}R</td>
                            <td className="mono" style={{ color: 'var(--text)', fontWeight: 700 }}>{p.avg_holding_duration}</td>
                            <td className="mono" style={{ color: GREEN, fontWeight: 700 }}>{p.avg_win_duration}</td>
                            <td className="mono" style={{ color: RED, fontWeight: 700 }}>{p.avg_loss_duration}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '16px 18px 8px 18px', marginBottom: 0 }}>
              <span className="section-title">Consecutive Drawdown Exposure per Asset</span>
            </div>
            {conLossDetail.length === 0 ? <Empty text="No risk drawdowns logged yet" /> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Asset Pair</th>
                      <th>Max Consecutive Loss Streak</th>
                      <th>Total Loss Amount ($ USD)</th>
                      <th>Total Closed Loss Trades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conLossDetail.map(c => (
                      <tr key={c.pair}>
                        <td className="mono" style={{ fontWeight: 800 }}>{c.pair}</td>
                        <td className="mono" style={{ color: 'var(--red)', fontWeight: 700 }}>
                          {c.max_con_loss}× Losses in a row
                        </td>
                        <td className="mono" style={{ color: 'var(--red)', fontWeight: 700 }}>
                          {c.total_loss_amount > 0 ? `-$${parseFloat(c.total_loss_amount).toFixed(2)}` : '—'}
                        </td>
                        <td className="mono">{c.total_losses} times</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '16px 18px 8px 18px', marginBottom: 0 }}>
              <span className="section-title">Trading Psychology & Emotional Cost Impact Matrix</span>
            </div>
            {tagAnalysis.length === 0 ? <Empty text="No behavior tags recorded yet. Tag your entries to isolate psychological patterns!" /> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Behavior / Emotional Tag</th>
                      <th>Total Sample</th>
                      <th>Wins</th>
                      <th>Losses</th>
                      <th>Win Rate</th>
                      <th>Visual Expectancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagAnalysis.map(t => {
                      const wrVal = parseFloat(t.win_rate) || 0
                      const tagColor = t.tag.toLowerCase().includes('planned') || t.tag.toLowerCase().includes('discipline') ? 'var(--green)' : 'var(--purple)'
                      return (
                        <tr key={t.tag}>
                          <td style={{ fontWeight: 600 }}>
                            <span className="badge" style={{ borderColor: 'rgba(157,127,232,0.15)', color: tagColor, background: 'rgba(157,127,232,0.03)' }}>
                              {t.tag.toUpperCase()}
                            </span>
                          </td>
                          <td className="mono">{t.total} trades</td>
                          <td className="mono" style={{ color: GREEN }}>{t.win}</td>
                          <td className="mono" style={{ color: RED }}>{t.loss}</td>
                          <td className="mono" style={{ color: wrVal >= 50 ? GREEN : RED, fontWeight: 700 }}>{wrVal}%</td>
                          <td style={{ minWidth: 120 }}>
                            <div className="bar-wrap">
                              <div className="bar-fill" style={{ width: `${wrVal}%`, background: wrVal >= 55 ? GREEN : wrVal >= 45 ? YELLOW : RED }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="section-title">Risk & Drawdown diagnostics</span>
              <span className="mono" style={{ color: 'var(--red)', fontSize: 12, fontWeight: 700 }}>
                Max Trough: {minDrawdown}R ({ddPct}% Depth)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 10 }}>
              {[
                ['Peak Equity Level', maxEquity + 'R', GREEN],
                ['Current Level', (lastEquity?.equity || 0) + 'R', (lastEquity?.equity || 0) >= 0 ? GREEN : RED],
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
                  <Tooltip 
                    contentStyle={CHART_STYLE} 
                    formatter={(v, name, props) => [`${v}% Win Rate (across ${props.payload.total} trades)`, 'Win Rate']} 
                  />
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
                  <Tooltip 
                    contentStyle={CHART_STYLE} 
                    formatter={(v, name, props) => [`${v}% Win Rate (across ${props.payload.total} trades)`, 'Win Rate']} 
                  />
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