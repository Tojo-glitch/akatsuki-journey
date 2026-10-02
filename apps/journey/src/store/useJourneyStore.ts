import { create } from 'zustand';
import { ChartCategory, ChartEntry, Level1Stats, TradingSession, Timeframe } from '@kecha/shared-types';
import { calculateLevel1Stats, storageHelper, idbHelper } from '@kecha/shared-utils';

const STORAGE_KEY = 'nostoi_journey_level1_v1';

interface JourneyStoreState {
  entries: ChartEntry[];
  activeCategoryFilter: ChartCategory | 'all';
  activeSessionFilter: TradingSession | 'all';
  activeTimeframeFilter: Timeframe | 'all';
  searchPair: string;
  initStorage: () => Promise<void>;
  addEntry: (entry: Omit<ChartEntry, 'id' | 'createdAt'>) => void;
  addBatchEntries: (entriesData: Omit<ChartEntry, 'id' | 'createdAt'>[]) => void;
  updateEntry: (id: string, entry: Partial<ChartEntry>) => void;
  deleteEntry: (id: string) => void;
  setCategoryFilter: (cat: ChartCategory | 'all') => void;
  setSessionFilter: (session: TradingSession | 'all') => void;
  setTimeframeFilter: (tf: Timeframe | 'all') => void;
  setSearchPair: (pair: string) => void;
  getStats: () => Level1Stats;
}

export const useJourneyStore = create<JourneyStoreState>((set, get) => ({
  entries: storageHelper.get<ChartEntry[]>(STORAGE_KEY, []),
  activeCategoryFilter: 'all',
  activeSessionFilter: 'all',
  activeTimeframeFilter: 'all',
  searchPair: '',

  initStorage: async () => {
    const idbEntries = await idbHelper.get<ChartEntry[]>(STORAGE_KEY, get().entries);
    if (idbEntries.length > get().entries.length) {
      set({ entries: idbEntries });
    }
  },

  addEntry: (entryData) => {
    const newEntry: ChartEntry = {
      ...entryData,
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now()
    };
    const updated = [newEntry, ...get().entries];
    storageHelper.set(STORAGE_KEY, updated);
    idbHelper.set(STORAGE_KEY, updated);
    set({ entries: updated });
  },

  addBatchEntries: (entriesData) => {
    const newItems: ChartEntry[] = entriesData.map((e, idx) => ({
      ...e,
      id: `entry_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now() + idx
    }));
    const updated = [...newItems, ...get().entries];
    storageHelper.set(STORAGE_KEY, updated);
    idbHelper.set(STORAGE_KEY, updated);
    set({ entries: updated });
  },

  updateEntry: (id, partial) => {
    const updated = get().entries.map((item) => (item.id === id ? { ...item, ...partial } : item));
    storageHelper.set(STORAGE_KEY, updated);
    idbHelper.set(STORAGE_KEY, updated);
    set({ entries: updated });
  },

  deleteEntry: (id) => {
    const updated = get().entries.filter((item) => item.id !== id);
    storageHelper.set(STORAGE_KEY, updated);
    idbHelper.set(STORAGE_KEY, updated);
    set({ entries: updated });
  },

  setCategoryFilter: (category) => set({ activeCategoryFilter: category }),
  setSessionFilter: (session) => set({ activeSessionFilter: session }),
  setTimeframeFilter: (timeframe) => set({ activeTimeframeFilter: timeframe }),
  setSearchPair: (searchPair) => set({ searchPair }),

  getStats: () => calculateLevel1Stats(get().entries)
}));
