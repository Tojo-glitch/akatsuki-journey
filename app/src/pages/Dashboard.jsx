import React, { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { getDashboardStats, getByDayOfWeek, getByHour } from '../lib/api'
import { Badge, SkeletonStats, Empty, CountUp, fmtDate, fmtRR } from '../components/UI'

const GREEN='#26D9A0', RED='#FF5C7A', YELLOW='#FFC857', BLUE='#5B9FFF', PURPLE='#9D7FE8'
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const CHART_STYLE = { background:'#12161F', border:'1px solid #222A38', borderRadius:8, fontSize:12 }

export default function Dashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [dow,     setDow]     = useState([])   // by day of week
  const [hourly,  setHourly]  = useState([])   // by hour

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getByDayOfWeek(),
      getByHour(),
    ]).then(([stats, dowData, hourData]) => {
      setData(stats)
      setDow(dowData)
      setHourly(hourData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Loading…</div>
      <SkeletonStats />
      <div className="g2">
        {[1,2].map(i=><div key={i} className="skeleton" style={{ height:200, borderRadius:10 }} />)}
      </div>
    </div>
  )
  if (!data) return <Empty icon="⚠️" text="Failed to load. Check your Supabase connection." />

  const ov = data?.overall || {} // ป้องกัน ov เป็น undefined
  const wr = parseFloat(ov?.win_rate) || 0
  const totalRR = parseFloat(ov?.total_rr) || 0
  const wrColor = wr>=60 ? GREEN : wr>=45 ? YELLOW : RED

  // 1. เพิ่ม Optional Chaining ป้องกัน data.recent ไม่มีอยู่จริง
  const equityCurve = [...(data?.recent || [])].reverse().reduce((acc,t) => {
    const prev = acc.length ? acc[acc.length-1].y : 0
    const delta = t.result==='Win'?(parseFloat(t.rr)||1):t.result==='Loss'?-1:0
    acc.push({ x:acc.length+1, y:+(prev+delta).toFixed(2) })
    return acc
  }, [])

  const sessionOrder = ['Asia','London','New York'];
  const sessMap = {};
  // 2. ป้องกัน data.bySession เป็น undefined
  (data?.bySession || []).forEach(s => { sessMap[s.session] = s })

  // 3. ป้องกัน hourly เป็น undefined หรือ null
  const bestHours = [...(hourly || [])]
    .filter(h => h && h.total >= 3)
    .sort((a,b) => parseFloat(b?.win_rate || 0) - parseFloat(a?.win_rate || 0))
    .slice(0,3)

  const dowFull = DAYS.map((d,i) => {
    const found = dow?.find(x => x && x.dow === i)
    return { day: d, ...( found || { total:0, win:0, loss:0, win_rate:0 }) }
  })
  const tradedDays = dowFull.filter(d => d.total > 0)
  const bestDay  = tradedDays.sort((a,b)=>parseFloat(b.win_rate)-parseFloat(a.win_rate))[0] || { day: 'N/A', win_rate: 0 };
  const worstDay = tradedDays.sort((a,b)=>parseFloat(a.win_rate)-parseFloat(b.win_rate))[0] || { day: 'N/A', win_rate: 0 };
  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">All pairs combined · all time</div>

      {/* Stat cards */}
      <div className="stats-row">
        <div className={`stat-card ${wr>=50?'green':'red'}`}>
          <div className="stat-label">Win Rate</div>
          <div className="stat-value" style={{ color:wrColor }}>
            <CountUp value={wr} suffix="%" decimals={1} />
          </div>
          <div className="stat-sub">{ov.win}W · {ov.loss}L · {ov.miss}M</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value blue"><CountUp value={ov.total} /></div>
          <div className="stat-sub">All pairs</div>
        </div>
        <div className={`stat-card ${totalRR>=0?'green':'red'}`}>
          <div className="stat-label">Net R</div>
          <div className="stat-value" style={{ color:totalRR>=0?GREEN:RED }}>
            {totalRR>=0?'+':''}<CountUp value={totalRR} decimals={2} />R
          </div>
          <div className="stat-sub">Cumulative R:R</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Max Con. Loss</div>
          <div className="stat-value red"><CountUp value={ov.max_con_loss} /></div>
          <div className="stat-sub">Streak</div>
        </div>
      </div>

      {/* Equity + Session */}
      <div className="g2">
        <div className="card">
          <div className="card-header">
            <span className="section-title">Equity Curve (R)</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:13, color:totalRR>=0?GREEN:RED }}>{fmtRR(totalRR)}</span>
          </div>
          {equityCurve.length > 1 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={equityCurve} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                <defs><linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={totalRR>=0?GREEN:RED} stopOpacity={.22}/>
                  <stop offset="100%" stopColor={totalRR>=0?GREEN:RED} stopOpacity={0}/>
                </linearGradient></defs>
                <XAxis dataKey="x" hide />
                <YAxis tick={{ fontSize:10, fill:'#7B8299' }} />
                <Tooltip contentStyle={CHART_STYLE} formatter={v=>[fmtRR(v),'Equity']} labelFormatter={()=>''} />
                <Area dataKey="y" stroke={totalRR>=0?GREEN:RED} strokeWidth={2} fill="url(#eqG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty text="Add more trades to see curve" />}
        </div>

        <div className="card">
          <div className="card-header"><span className="section-title">By Session</span></div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {sessionOrder.map(sess => {
              const s = sessMap[sess] || { win:0, loss:0, total:0 }
              const wr2 = s.total>0 ? Math.round(s.win/s.total*100) : 0
              const color = sess==='Asia'?PURPLE:sess==='London'?BLUE:YELLOW
              return (
                <div key={sess} className="pair-row">
                  <span className="pair-name" style={{ width:76 }}>{sess}</span>
                  <div className="bar-wrap"><div className="bar-fill" style={{ width:`${wr2}%`, background:color }} /></div>
                  <span className="pair-stat">{wr2}% ({s.win}/{s.total})</span>
                </div>
              )
            })}
          </div>
          {/* Buy vs Sell */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14 }}>
            {['Buy','Sell'].map(dir => {
              const ts = data.recent.filter(t=>t.direction===dir)
              const w  = ts.filter(t=>t.result==='Win').length
              const tot = ts.filter(t=>t.result!=='Miss').length
              const wr3 = tot ? Math.round(w/tot*100) : 0
              return (
                <div key={dir} style={{ background:'var(--bg)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'var(--t2)', marginBottom:4 }}>{dir.toUpperCase()}</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:700, color:dir==='Buy'?GREEN:RED }}>{wr3}%</div>
                  <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{w}W/{tot-w}L ({ts.length})</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Day of Week + Hour analysis */}
      <div className="g2">
        {/* Day of Week */}
        <div className="card">
          <div className="card-header"><span className="section-title">📅 Best Day of Week</span></div>
          {dowFull.filter(d=>d.total>0).length === 0 ? <Empty text="Not enough data" /> : (
            <>
              <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                {bestDay && (
                  <div style={{ padding:'8px 14px', borderRadius:8, background:'rgba(38,217,160,.1)', border:'1px solid rgba(38,217,160,.2)', fontSize:12 }}>
                    🏆 Best: <strong style={{ color:GREEN }}>{bestDay.day}</strong> — {bestDay.win_rate}% WR
                  </div>
                )}
                {worstDay && worstDay.day !== bestDay?.day && (
                  <div style={{ padding:'8px 14px', borderRadius:8, background:'rgba(255,92,122,.08)', border:'1px solid rgba(255,92,122,.2)', fontSize:12 }}>
                    ⚠️ Worst: <strong style={{ color:RED }}>{worstDay.day}</strong> — {worstDay.win_rate}% WR
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={dowFull} margin={{ top:0, right:4, left:-24, bottom:0 }}>
                  <XAxis dataKey="day" tick={{ fontSize:10, fill:'#7B8299' }} />
                  <YAxis tick={{ fontSize:10, fill:'#7B8299' }} domain={[0,100]} unit="%" />
                  <Tooltip contentStyle={CHART_STYLE} formatter={v=>[v+'%','Win Rate']} />
                  <Bar dataKey="win_rate" radius={[4,4,0,0]}>
                    {dowFull.map((d,i) => (
                      <Cell key={i} fill={parseFloat(d.win_rate)>=50?GREEN:RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, flexWrap:'wrap', gap:4 }}>
                {dowFull.filter(d=>d.total>0).map(d => (
                  <div key={d.day} style={{ textAlign:'center', fontSize:11 }}>
                    <div style={{ color:'var(--t2)' }}>{d.day}</div>
                    <div style={{ fontFamily:'var(--mono)', color:parseFloat(d.win_rate)>=50?GREEN:RED }}>{d.win_rate||0}%</div>
                    <div style={{ color:'var(--t3)', fontSize:10 }}>{d.total}T</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Best Hour / Session time */}
        <div className="card">
          <div className="card-header"><span className="section-title">⏰ Best Trading Hours</span></div>
          {hourly.length === 0 ? <Empty text="Add trades with entry time to see this" /> : (
            <>
              {bestHours.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
                  {bestHours.map(h => {
                    const sess = h.hour>=1&&h.hour<8?'Asia':h.hour>=8&&h.hour<16?'London':'New York'
                    const color = sess==='Asia'?PURPLE:sess==='London'?BLUE:YELLOW
                    return (
                      <div key={h.hour} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'var(--bg)', borderRadius:7, border:'1px solid var(--border)' }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color, minWidth:50 }}>
                          {String(h.hour).padStart(2,'0')}:00
                        </span>
                        <span style={{ fontSize:11, color, minWidth:56 }}>{sess}</span>
                        <div className="bar-wrap"><div className="bar-fill" style={{ width:`${h.win_rate}%`, background:color }} /></div>
                        <span style={{ fontFamily:'var(--mono)', fontSize:12, minWidth:40, textAlign:'right', color }}>{h.win_rate}%</span>
                        <span style={{ fontSize:10, color:'var(--t3)' }}>({h.win}W/{h.loss}L)</span>
                      </div>
                    )
                  })}
                </div>
              )}
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={hourly} margin={{ top:0, right:4, left:-28, bottom:0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize:9, fill:'#7B8299' }} />
                  <YAxis hide domain={[0,100]} />
                  <Tooltip contentStyle={CHART_STYLE}
                    formatter={(v,n,p) => [`${v}% WR (${p.payload.win}W/${p.payload.loss}L)`, `Hour ${p.payload.hour}:00`]}
                    labelFormatter={()=>''} />
                  <Bar dataKey="win_rate" radius={[3,3,0,0]}
                    fill={GREEN} opacity={.8} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* By Pair + By Setup */}
      <div className="g2">
        <div className="card">
          <div className="card-header"><span className="section-title">By Pair</span></div>
          {data.byPair.length===0 ? <Empty text="No data" /> : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {data.byPair.map(p => {
                const wr2 = parseFloat(p.win_rate)||0
                const c = wr2>=60?GREEN:wr2>=45?YELLOW:RED
                return (
                  <div key={p.pair} className="pair-row">
                    <span className="pair-name">{p.pair}</span>
                    <div className="bar-wrap"><div className="bar-fill" style={{ width:`${wr2}%`, background:c }} /></div>
                    <span className="pair-stat">{wr2}% ({p.total})</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-header"><span className="section-title">By Setup</span></div>
          {data.bySetup.length===0 ? <Empty text="No data" /> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', fontSize:12 }}>
                <thead><tr><th>Setup</th><th>Win</th><th>Loss</th><th>WR%</th></tr></thead>
                <tbody>
                  {data.bySetup.map(s => {
                    const wr2 = s.total>0?Math.round(s.win/s.total*100):0
                    return (
                      <tr key={s.setup_type}>
                        <td style={{ fontFamily:'var(--mono)', fontSize:11 }}>{s.setup_type||'—'}</td>
                        <td style={{ color:GREEN }}>{s.win}</td>
                        <td style={{ color:RED }}>{s.loss}</td>
                        <td style={{ fontFamily:'var(--mono)', color:wr2>=50?GREEN:RED, fontWeight:700 }}>{wr2}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">Recent Trades</span>
          <span style={{ fontSize:11, color:'var(--t2)' }}>{data.recent.length} loaded</span>
        </div>
        {data.recent.length===0 ? <Empty text="No trades yet — add your first trade!" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Pair</th><th>Dir</th><th>Setup</th><th>Session</th><th>R:R</th><th>Con.L</th><th>Result</th></tr></thead>
              <tbody>
                {data.recent.slice(0,15).map(t=>(
                  <tr key={t.id}>
                    <td className="mono dim" style={{ fontSize:11 }}>{fmtDate(t.trade_date)}</td>
                    <td style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:12 }}>{t.pair}</td>
                    <td><Badge type={t.direction}>{t.direction}</Badge></td>
                    <td style={{ fontSize:11, color:'var(--t2)' }}>{t.setup_type||'—'}</td>
                    <td><Badge type={t.session}>{t.session}</Badge></td>
                    <td className="mono" style={{ color:YELLOW, fontSize:12 }}>{t.rr?'1:'+t.rr:'—'}</td>
                    <td className="mono neg" style={{ fontSize:12 }}>{t.con_loss||''}</td>
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

// helpers now in api.js