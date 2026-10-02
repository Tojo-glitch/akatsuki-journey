import { CategoryProgress, ChartCategory } from '@kecha/shared-types';
import { ProgressRing } from '@kecha/shared-ui';

interface CategoryProgressCardProps {
  progress: CategoryProgress;
  isSelected: boolean;
  onSelect: (cat: ChartCategory) => void;
  accentColor: string;
}

export function CategoryProgressCard({
  progress,
  isSelected,
  onSelect,
  accentColor
}: CategoryProgressCardProps) {
  return (
    <div
      onClick={() => onSelect(progress.category)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '24px',
        cursor: 'pointer',
        boxShadow: isSelected ? '0 0 0 2px #0f172a, 0 10px 25px -5px rgba(0,0,0,0.06)' : '0 2px 12px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      <ProgressRing
        progress={progress.percentage}
        size={110}
        strokeWidth={8}
        currentValue={progress.current}
        targetValue={progress.target}
        remainingText={`${progress.remaining} left`}
        colorClass={accentColor}
      />
      <h3 style={{ margin: '14px 0 4px', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
        {progress.title}
      </h3>
      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
        {progress.percentage}% Target Achieved
      </span>
    </div>
  );
}
