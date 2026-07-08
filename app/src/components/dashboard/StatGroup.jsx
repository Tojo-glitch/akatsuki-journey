import React from 'react'
import { CountUp } from '../UI'

const GREEN = '#26D9A0'
const RED = '#FF5C7A'
const YELLOW = '#FFC857'

export default function StatGroup({ ov, wr, totalRR }) {
  const wrColor = wr >= 60 ? GREEN : wr >= 45 ? YELLOW : RED

  return (
    <div className="stats-row" style={{ marginBottom: 14 }}>
      <div className={`stat-card ${wr >= 50 ? 'green' : 'red'}`}>
        <div className="stat-label">Win Rate</div>
        <div className="stat-value" style={{ color: wrColor }}>
          <CountUp value={wr} suffix="%" decimals={1} />
        </div>
        <div className="stat-sub">{ov.win || 0}W · {ov.loss || 0}L · {ov.miss || 0}M</div>
      </div>
      <div className="stat-card blue">
        <div className="stat-label">Total Trades</div>
        <div className="stat-value blue"><CountUp value={ov.total || 0} /></div>
        <div className="stat-sub">All pairs</div>
      </div>
      <div className={`stat-card ${totalRR >= 0 ? 'green' : 'red'}`}>
        <div className="stat-label">Net R</div>
        <div className="stat-value" style={{ color: totalRR >= 0 ? GREEN : RED }}>
          {totalRR >= 0 ? '+' : ''}<CountUp value={totalRR} decimals={2} />R
        </div>
        <div className="stat-sub">Cumulative R:R</div>
      </div>
      <div className="stat-card red">
        <div className="stat-label">Max Con. Loss</div>
        <div className="stat-value red"><CountUp value={ov.max_con_loss || 0} /></div>
        <div className="stat-sub">Streak</div>
      </div>
    </div>
  )
}