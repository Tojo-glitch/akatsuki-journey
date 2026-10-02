import { TradingEdgeStats } from '@kecha/shared-utils';
import { Activity } from 'lucide-react';

interface EquityCurveChartProps {
  stats: TradingEdgeStats;
}

export function EquityCurveChart({ stats }: EquityCurveChartProps) {
  const data = stats.equityCurve;

  if (data.length < 2) {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '40px 24px', textAlign: 'center', marginBottom: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
        <Activity size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
        <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Log 2+ Trades to Generate Equity Curve</h4>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>The cumulative R curve will map your performance progression over time.</p>
      </div>
    );
  }

  const values = data.map((d) => d.cumR);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(1, ...values);
  const range = maxVal - minVal || 1;
  const width = 800;
  const height = 180;
  const padding = 30;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.cumR - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const zeroY = height - padding - ((0 - minVal) / range) * (height - padding * 2);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '28px', padding: '28px', marginBottom: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Cumulative Net R Equity Curve</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Skill progression curve mapped in pure R-multiples</p>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: stats.totalNetR >= 0 ? '#16a34a' : '#ef4444' }}>
          Current: {stats.totalNetR > 0 ? `+${stats.totalNetR}` : stats.totalNetR} R
        </span>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1.5" />
          <polyline fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
          {data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - padding * 2);
            const y = height - padding - ((d.cumR - minVal) / range) * (height - padding * 2);
            return (
              <circle key={d.tradeNo} cx={x} cy={y} r="4" fill={d.r >= 0 ? '#16a34a' : '#ef4444'} stroke="#ffffff" strokeWidth="1.5" />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
