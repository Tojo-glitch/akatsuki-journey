import { Sparkles, Layers } from 'lucide-react';
import { Level1Stats } from '@kecha/shared-types';
import { OdometerCount, ProgressRing } from '@kecha/shared-ui';

interface LevelOverviewCardProps {
  stats: Level1Stats;
  onOpenExpressIngest?: () => void;
}

export function LevelOverviewCard({ stats, onOpenExpressIngest }: LevelOverviewCardProps) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '28px',
      padding: '32px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
      marginBottom: '32px',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: '32px',
      alignItems: 'center'
    }}>
      <div>
        <ProgressRing
          progress={stats.overallPercentage}
          size={140}
          strokeWidth={11}
          currentValue={stats.totalCollected}
          targetValue={stats.totalTarget}
          remainingText={`${stats.totalRemaining} to Complete`}
          colorClass="#0f172a"
        />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
            LEVEL 1 STAGE
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} color="#f59e0b" /> Ninja Pattern Collector
          </span>
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
          Level 1: 400 Chart Quest
        </h2>

        <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
          Collect 100 screenshots per market structure. Have 100 photos ready?
        </p>

        {onOpenExpressIngest && (
          <button
            onClick={onOpenExpressIngest}
            type="button"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#0ea5e9', color: '#ffffff', border: 'none',
              borderRadius: '12px', padding: '7px 14px', fontSize: '0.82rem',
              fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
            }}
          >
            <Layers size={14} /> ⚡ 100-Photo Express Ingest
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '24px', paddingLeft: '24px', borderLeft: '1px solid #f1f5f9' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Collected</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}><OdometerCount value={stats.totalCollected} /></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Remaining</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#64748b' }}><OdometerCount value={stats.totalRemaining} /></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Progress</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}><OdometerCount value={stats.overallPercentage} suffix="%" /></div>
        </div>
      </div>
    </div>
  );
}
