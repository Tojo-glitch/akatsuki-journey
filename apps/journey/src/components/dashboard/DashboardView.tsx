import { useJournalStore } from '../../store/useJournalStore';
import { useJourneyStore } from '../../store/useJourneyStore';
import { calculateTradingEdge } from '@kecha/shared-utils';
import { ExpectancyBanner } from './ExpectancyBanner';
import { EquityCurveChart } from './EquityCurveChart';
import { SetupSessionBreakdown } from './SetupSessionBreakdown';
import { LevelOverviewCard } from '../LevelOverviewCard';

export function DashboardView() {
  const { trades } = useJournalStore();
  const { getStats } = useJourneyStore();

  const edgeStats = calculateTradingEdge(trades);
  const patternStats = getStats();

  return (
    <div>
      <ExpectancyBanner stats={edgeStats} />
      <EquityCurveChart stats={edgeStats} />
      <div style={{ marginBottom: '28px' }}>
        <LevelOverviewCard stats={patternStats} />
      </div>
      <SetupSessionBreakdown stats={edgeStats} />
    </div>
  );
}
