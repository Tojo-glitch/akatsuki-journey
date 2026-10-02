import { ChartCategory, ChartEntry, Level1Stats, TradeJournalEntry } from '@kecha/shared-types';

export const CATEGORY_METADATA: Record<ChartCategory, { title: string; target: number }> = {
  internal_up_to_down: { title: 'Internal Up to Down', target: 100 },
  internal_down_to_up: { title: 'Internal Down to Up', target: 100 },
  external_uptrend: { title: 'External Uptrend', target: 100 },
  external_downtrend: { title: 'External Downtrend', target: 100 }
};

export const calculateLevel1Stats = (entries: ChartEntry[]): Level1Stats => {
  const counts: Record<ChartCategory, number> = {
    internal_up_to_down: 0, internal_down_to_up: 0, external_uptrend: 0, external_downtrend: 0
  };
  entries.forEach((item) => {
    if (counts[item.category] !== undefined) counts[item.category] += 1;
  });
  const categories = Object.keys(CATEGORY_METADATA).reduce((acc, catKey) => {
    const key = catKey as ChartCategory;
    const target = CATEGORY_METADATA[key].target;
    const current = counts[key];
    acc[key] = {
      category: key, title: CATEGORY_METADATA[key].title, target, current,
      remaining: Math.max(0, target - current), percentage: Math.min(100, Math.round((current / target) * 100))
    };
    return acc;
  }, {} as Level1Stats['categories']);

  const totalTarget = 400;
  const totalCollected = entries.length;
  return {
    totalTarget, totalCollected, totalRemaining: Math.max(0, totalTarget - totalCollected),
    overallPercentage: Math.min(100, Math.round((totalCollected / totalTarget) * 100)),
    currentLevel: 1, categories
  };
};

export interface TradingEdgeStats {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  beCount: number;
  winRate: number;
  totalNetR: number;
  avgWinR: number;
  avgLossR: number;
  profitFactor: number;
  expectancyR: number;
  wyckoff: { trades: number; winRate: number; netR: number };
  reapper: { trades: number; winRate: number; netR: number };
  sessionBreakdown: Record<string, { trades: number; winRate: number; netR: number }>;
  equityCurve: { tradeNo: number; date: string; pair: string; r: number; cumR: number }[];
}

export const calculateTradingEdge = (trades: TradeJournalEntry[]): TradingEdgeStats => {
  const sorted = [...trades].sort((a, b) => a.createdAt - b.createdAt);
  let cumR = 0;
  let grossWinR = 0;
  let grossLossR = 0;
  let winCount = 0;
  let lossCount = 0;
  let beCount = 0;

  const sessionMap: Record<string, { trades: number; wins: number; netR: number }> = {};
  const setupMap: Record<string, { trades: number; wins: number; netR: number }> = {
    wyckoff: { trades: 0, wins: 0, netR: 0 },
    reapper: { trades: 0, wins: 0, netR: 0 }
  };

  const equityCurve = sorted.map((t, idx) => {
    const r = t.rMultiple ?? (t.result === 'win' ? 2 : t.result === 'loss' ? -1 : 0);
    cumR += r;
    if (r > 0) { grossWinR += r; winCount++; }
    else if (r < 0) { grossLossR += Math.abs(r); lossCount++; }
    else { beCount++; }

    const sKey = t.session || 'Unknown';
    if (!sessionMap[sKey]) sessionMap[sKey] = { trades: 0, wins: 0, netR: 0 };
    sessionMap[sKey].trades++;
    sessionMap[sKey].netR += r;
    if (r > 0) sessionMap[sKey].wins++;

    const stKey = t.setup?.toLowerCase().includes('reapper') ? 'reapper' : 'wyckoff';
    setupMap[stKey].trades++;
    setupMap[stKey].netR += r;
    if (r > 0) setupMap[stKey].wins++;

    return { tradeNo: idx + 1, date: t.date, pair: t.pair, r, cumR: Number(cumR.toFixed(2)) };
  });

  const totalTrades = sorted.length;
  const winRate = totalTrades > 0 ? Math.round((winCount / totalTrades) * 100) : 0;
  const lossRate = totalTrades > 0 ? lossCount / totalTrades : 0;
  const winRateRatio = totalTrades > 0 ? winCount / totalTrades : 0;
  const avgWinR = winCount > 0 ? Number((grossWinR / winCount).toFixed(2)) : 0;
  const avgLossR = lossCount > 0 ? Number((grossLossR / lossCount).toFixed(2)) : 0;
  const profitFactor = grossLossR > 0 ? Number((grossWinR / grossLossR).toFixed(2)) : grossWinR > 0 ? 99 : 0;
  const expectancyR = Number(((winRateRatio * avgWinR) - (lossRate * avgLossR)).toFixed(2));

  return {
    totalTrades, winCount, lossCount, beCount, winRate,
    totalNetR: Number(cumR.toFixed(2)), avgWinR, avgLossR, profitFactor, expectancyR,
    wyckoff: {
      trades: setupMap.wyckoff.trades,
      winRate: setupMap.wyckoff.trades > 0 ? Math.round((setupMap.wyckoff.wins / setupMap.wyckoff.trades) * 100) : 0,
      netR: Number(setupMap.wyckoff.netR.toFixed(2))
    },
    reapper: {
      trades: setupMap.reapper.trades,
      winRate: setupMap.reapper.trades > 0 ? Math.round((setupMap.reapper.wins / setupMap.reapper.trades) * 100) : 0,
      netR: Number(setupMap.reapper.netR.toFixed(2))
    },
    sessionBreakdown: Object.keys(sessionMap).reduce((acc, k) => {
      acc[k] = {
        trades: sessionMap[k].trades,
        winRate: sessionMap[k].trades > 0 ? Math.round((sessionMap[k].wins / sessionMap[k].trades) * 100) : 0,
        netR: Number(sessionMap[k].netR.toFixed(2))
      };
      return acc;
    }, {} as Record<string, { trades: number; winRate: number; netR: number }>),
    equityCurve
  };
};
