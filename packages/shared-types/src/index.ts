export type ChartCategory = 
  | 'internal_up_to_down'
  | 'internal_down_to_up'
  | 'external_uptrend'
  | 'external_downtrend';

export type TradingSession = string;
export type Timeframe = string;
export type SetupType = 'wyckoff' | 'reapper' | string;
export type TradeResult = 'win' | 'loss' | 'breakeven' | 'running';
export type JourneyLevel = 1 | 2 | 3;

export interface ConfigItem {
  id: string;
  name: string;
  enabled: boolean;
}

export interface SessionTimeConfig {
  name: string;
  startHour: number;
  endHour: number;
}

export interface ChartEntry {
  id: string;
  category: ChartCategory;
  pair: string;
  timeframe: Timeframe;
  session: TradingSession;
  imageUrl: string;
  notes?: string;
  createdAt: number;
}

export interface TradeComment {
  id: string;
  tradeId: string;
  authorName: string;
  avatarUrl?: string;
  content: string;
  createdAt: number;
}

export interface TradeJournalEntry {
  id: string;
  date: string;
  pair: string;
  timeframe: Timeframe;
  session: TradingSession;
  setup: SetupType;
  direction: 'buy' | 'sell';
  result: TradeResult;
  rMultiple?: number;
  imageUrl: string;
  notes?: string;
  createdAt: number;
}

export interface SystemSettings {
  pairs: ConfigItem[];
  timeframes: ConfigItem[];
  sessions: ConfigItem[];
  setups: ConfigItem[];
  sessionTimes: SessionTimeConfig[];
}

export interface CategoryProgress {
  category: ChartCategory;
  title: string;
  target: number;
  current: number;
  remaining: number;
  percentage: number;
}

export interface Level1Stats {
  totalTarget: number;
  totalCollected: number;
  totalRemaining: number;
  overallPercentage: number;
  currentLevel: number;
  categories: Record<ChartCategory, CategoryProgress>;
}

export interface SystemFlowNode {
  id: string;
  sourceApp: string;
  subRoute: string;
  storageKey: string;
  label: string;
  status: 'active' | 'synced' | 'pending';
}
