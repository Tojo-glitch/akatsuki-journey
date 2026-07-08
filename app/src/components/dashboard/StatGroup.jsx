import React from 'react'
import { CountUp } from '../UI'

export default function StatGroup({ ov, wr, totalRR, streakDays, adherenceScore }) {
  const totalTradesCount = ov.total || 0
  
  // 🌟 บังคับตั้งค่าเพดานขั้นต่ำที่จะถือว่าสถิติมีความน่าเชื่อถือจริง (เช่น นัยสำคัญอย่างน้อย 10 เทรดขึ้นไป)
  const isDataInconclusive = totalTradesCount < 10

  const wrColor = wr >= 55 ? 'var(--green)' : wr >= 45 ? 'var(--yellow)' : 'var(--red)'
  const adhColor = adherenceScore >= 70 ? 'var(--green)' : adherenceScore >= 50 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
      
      {/* CARD 1: WIN RATE */}
      <div className={`stat-card ${wr >= 50 ? 'green' : 'red'}`} style={{ opacity: isDataInconclusive ? 0.65 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="stat-label" style={{ marginBottom: 0 }}>Win Rate</div>
          {isDataInconclusive && (
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--yellow)', letterSpacing: '0.04em' }}>[PRELIMINARY]</span>
          )}
        </div>
        <div className="stat-value" style={{ color: wrColor }}>
          <CountUp value={wr} suffix="%" decimals={1} />
        </div>
        <div className="stat-sub">{ov.win || 0}W · {ov.loss || 0}L · {ov.miss || 0}M</div>
      </div>

      {/* CARD 2: CUMULATIVE NET R */}
      <div className={`stat-card ${totalRR >= 0 ? 'green' : 'red'}`} style={{ opacity: isDataInconclusive ? 0.65 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="stat-label" style={{ marginBottom: 0 }}>Net Return</div>
          {isDataInconclusive && (
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--yellow)', letterSpacing: '0.04em' }}>[UNCONFIRMED]</span>
          )}
        </div>
        <div className="stat-value" style={{ color: totalRR >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {totalRR >= 0 ? '+' : ''}<CountUp value={totalRR} decimals={2} />R
        </div>
        <div className="stat-sub">Cumulative R:R</div>
      </div>

      {/* CARD 3: DISCIPLINE INDEX */}
      <div className={`stat-card ${adherenceScore >= 60 ? 'green' : 'red'}`} style={{ opacity: isDataInconclusive ? 0.65 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="stat-label" style={{ marginBottom: 0 }}>Discipline Index</div>
          {isDataInconclusive && (
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--yellow)', letterSpacing: '0.04em' }}>[NO RULE DATA]</span>
          )}
        </div>
        <div className="stat-value" style={{ color: adhColor }}>
          <CountUp value={adherenceScore} suffix="%" decimals={1} />
        </div>
        <div className="stat-sub">Rule Adherence Rate</div>
      </div>

      {/* CARD 4: LOGGING HABIT STREAK */}
      <div className="stat-card purple">
        <div className="stat-label">Logging Streak</div>
        <div className="stat-value" style={{ color: 'var(--purple)' }}>
          <CountUp value={streakDays} suffix=" Days" />
        </div>
        <div className="stat-sub">Consecutive Active Days</div>
      </div>

      {/* CARD 5: TOTAL EXECUTIONS */}
      <div className="stat-card blue">
        <div className="stat-label">Total Trades</div>
        <div className="stat-value" style={{ color: 'var(--blue)' }}>
          <CountUp value={totalTradesCount} />
        </div>
        <div className="stat-sub">All-Time Executions</div>
      </div>

    </div>
  )
}