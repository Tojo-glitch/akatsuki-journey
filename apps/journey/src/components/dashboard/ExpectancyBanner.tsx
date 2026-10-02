import { TradingEdgeStats } from '@kecha/shared-utils';
import { OdometerCount } from '@kecha/shared-ui';
import { Sparkles, TrendingUp, Award, ShieldAlert } from 'lucide-react';

interface ExpectancyBannerProps {
  stats: TradingEdgeStats;
}

export function ExpectancyBanner({ stats }: ExpectancyBannerProps) {
  const isPositiveExp = stats.expectancyR >= 0;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '28px',
      padding: '28px 32px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
      marginBottom: '28px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '24px',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
          <Sparkles size={14} color="#0ea5e9" /> Expectancy (EV per Trade)
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: isPositiveExp ? '#16a34a' : '#ef4444' }}>
          {stats.expectancyR > 0 ? `+${stats.expectancyR}` : stats.expectancyR} <span style={{ fontSize: '1rem', fontWeight: 600 }}>R</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mathematical Edge per execution</span>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
          <TrendingUp size={14} color="#16a34a" /> Cumulative Net Return
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: stats.totalNetR >= 0 ? '#0f172a' : '#ef4444' }}>
          {stats.totalNetR > 0 ? `+${stats.totalNetR}` : stats.totalNetR} <span style={{ fontSize: '1rem', fontWeight: 600 }}>R</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total R-Multiple realized</span>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
          <Award size={14} color="#6366f1" /> Win Rate & Realized RR
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
          <OdometerCount value={stats.winRate} suffix="%" />
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: '8px' }}>
            ({stats.avgWinR}R / -{stats.avgLossR}R)
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Win: {stats.winCount} | Loss: {stats.lossCount} | BE: {stats.beCount}</span>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
          <ShieldAlert size={14} color="#f59e0b" /> Profit Factor
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: stats.profitFactor >= 1.5 ? '#16a34a' : '#0f172a' }}>
          {stats.profitFactor}
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gross Wins / Gross Losses</span>
      </div>
    </div>
  );
}
