import { ChartCategory, Level1Stats } from '@kecha/shared-types';
import { CategoryProgressCard } from './CategoryProgressCard';

interface CategoryProgressGridProps {
  stats: Level1Stats;
  selectedCategory: ChartCategory | 'all';
  onSelectCategory: (cat: ChartCategory | 'all') => void;
}

const CATEGORY_COLORS: Record<ChartCategory, string> = {
  internal_up_to_down: '#0284c7',
  internal_down_to_up: '#10b981',
  external_uptrend: '#6366f1',
  external_downtrend: '#f59e0b'
};

export function CategoryProgressGrid({
  stats,
  selectedCategory,
  onSelectCategory
}: CategoryProgressGridProps) {
  const categoryKeys: ChartCategory[] = [
    'internal_up_to_down',
    'internal_down_to_up',
    'external_uptrend',
    'external_downtrend'
  ];

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
          4 Structural Quests (100 Target Each)
        </h3>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Show All Quests
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {categoryKeys.map((catKey) => (
          <CategoryProgressCard
            key={catKey}
            progress={stats.categories[catKey]}
            isSelected={selectedCategory === catKey}
            onSelect={(cat) => onSelectCategory(selectedCategory === cat ? 'all' : cat)}
            accentColor={CATEGORY_COLORS[catKey]}
          />
        ))}
      </div>
    </div>
  );
}
