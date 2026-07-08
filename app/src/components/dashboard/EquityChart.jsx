import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Empty, fmtRR } from '../UI'

const GREEN = '#26D9A0'
const RED = '#FF5C7A'
const CHART_STYLE = { background: '#12161F', border: '1px solid #222A38', borderRadius: 8, fontSize: 12 }

export default function EquityChart({ equityCurve, totalRR }) {
  const isPositive = totalRR >= 0
  const color = isPositive ? GREEN : RED

  return (
    <div className="card">
      <div className="card-header">
        <span className="section-title">Equity Curve (R)</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color }}>{fmtRR(totalRR)}</span>
      </div>
      {equityCurve.length > 1 ? (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={equityCurve} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="x" hide />
            <YAxis tick={{ fontSize: 10, fill: '#7B8299' }} />
            <Tooltip contentStyle={CHART_STYLE} formatter={v => [fmtRR(v), 'Equity']} labelFormatter={() => ''} />
            <Area dataKey="y" stroke={color} strokeWidth={2} fill="url(#eqG)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : <Empty text="Add more trades to see curve" />}
    </div>
  )
}