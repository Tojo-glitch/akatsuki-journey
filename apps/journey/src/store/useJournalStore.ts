import { create } from 'zustand';
import { TradeJournalEntry, TradeComment } from '@kecha/shared-types';
import { storageHelper } from '@kecha/shared-utils';

const JOURNAL_KEY = 'nostoi_journal_entries_v1';
const COMMENTS_KEY = 'nostoi_journal_comments_v1';

interface JournalStoreState {
  trades: TradeJournalEntry[];
  comments: TradeComment[];
  addTrade: (entry: Omit<TradeJournalEntry, 'id' | 'createdAt'>) => void;
  updateTrade: (id: string, entry: Partial<TradeJournalEntry>) => void;
  deleteTrade: (id: string) => void;
  addComment: (tradeId: string, authorName: string, content: string) => void;
  getCommentsByTrade: (tradeId: string) => TradeComment[];
}

export const useJournalStore = create<JournalStoreState>((set, get) => ({
  trades: storageHelper.get<TradeJournalEntry[]>(JOURNAL_KEY, []),
  comments: storageHelper.get<TradeComment[]>(COMMENTS_KEY, []),

  addTrade: (entryData) => {
    const newTrade: TradeJournalEntry = {
      ...entryData,
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now()
    };
    const updated = [newTrade, ...get().trades];
    storageHelper.set(JOURNAL_KEY, updated);
    set({ trades: updated });
  },

  updateTrade: (id, partial) => {
    const updated = get().trades.map((t) => (t.id === id ? { ...t, ...partial } : t));
    storageHelper.set(JOURNAL_KEY, updated);
    set({ trades: updated });
  },

  deleteTrade: (id) => {
    const updatedTrades = get().trades.filter((t) => t.id !== id);
    const updatedComments = get().comments.filter((c) => c.tradeId !== id);
    storageHelper.set(JOURNAL_KEY, updatedTrades);
    storageHelper.set(COMMENTS_KEY, updatedComments);
    set({ trades: updatedTrades, comments: updatedComments });
  },

  addComment: (tradeId, authorName, content) => {
    const newComment: TradeComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tradeId,
      authorName: authorName.trim() || 'Anonymous Trader',
      content: content.trim(),
      createdAt: Date.now()
    };
    const updated = [...get().comments, newComment];
    storageHelper.set(COMMENTS_KEY, updated);
    set({ comments: updated });
  },

  getCommentsByTrade: (tradeId) => {
    return get().comments.filter((c) => c.tradeId === tradeId);
  }
}));
