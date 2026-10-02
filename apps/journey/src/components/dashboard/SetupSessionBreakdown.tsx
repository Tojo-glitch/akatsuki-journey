import { TradingEdgeStats } from '@kecha/shared-utils';

interface SetupSessionBreakdownProps {
  stats: TradingEdgeStats;
}

export function SetupSessionBreakdown({ stats }: SetupSessionBreakdownProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Setup Edge: Wyckoff vs Reapper</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '16px' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>Wyckoff Framework</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{stats.wyckoff.trades} Executions • {stats.wyckoff.winRate}% Win Rate</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: stats.wyckoff.netR >= 0 ? '#16a34a' : '#ef4444' }}>
              {stats.wyckoff.netR > 0 ? `+${stats.wyckoff.netR}` : stats.wyckoff.netR} R
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '16px' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>Reapper Strategy</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{stats.reapper.trades} Executions • {stats.reapper.winRate}% Win Rate</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: stats.reapper.netR >= 0 ? '#16a34a' : '#ef4444' }}>
              {stats.reapper.netR > 0 ? `+${stats.reapper.netR}` : stats.reapper.netR} R
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Session Performance Matrix</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.keys(stats.sessionBreakdown).length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>No session data yet.</p>
          ) : (
            Object.entries(stats.sessionBreakdown).map(([sessionName, data]) => (
              <div key={sessionName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '14px' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{sessionName} Session</span>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{data.trades} Trades • {data.winRate}% Win</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: data.netR >= 0 ? '#16a34a' : '#ef4444' }}>
                  {data.netR > 0 ? `+${data.netR}` : data.netR} R
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
