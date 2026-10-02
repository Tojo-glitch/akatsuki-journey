import { useState } from 'react';
import { useJournalStore } from '../store/useJournalStore';
import { useAuthStore } from '@kecha/shared-auth';
import { TradeFeedbackModal } from './TradeFeedbackModal';
import { Badge, OdometerCount, TablePagination, ConfirmDeleteModal } from '@kecha/shared-ui';
import { MessageSquare, Trash2, Zap, Edit3, Eye, Search } from 'lucide-react';
import { TradeJournalEntry } from '@kecha/shared-types';

interface JournalViewProps {
  onOpenLogModal?: () => void;
  onEditTrade?: (trade: TradeJournalEntry) => void;
}

export function JournalView({ onOpenLogModal, onEditTrade }: JournalViewProps) {
  const { trades, deleteTrade, getCommentsByTrade } = useJournalStore();
  const { isOwner } = useAuthStore();
  const [selectedTrade, setSelectedTrade] = useState<TradeJournalEntry | null>(null);
  const [deletingTrade, setDeletingTrade] = useState<TradeJournalEntry | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = trades.filter((t) =>
    t.pair.toLowerCase().includes(search.toLowerCase()) ||
    t.setup.toLowerCase().includes(search.toLowerCase()) ||
    t.session.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const wins = trades.filter((t) => t.result === 'win').length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  const wyckoffCount = trades.filter((t) => t.setup.toLowerCase() === 'wyckoff').length;
  const reapperCount = trades.filter((t) => t.setup.toLowerCase() === 'reapper').length;

  return (
    <div>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '28px', padding: '28px 32px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          <div><div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Executions</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}><OdometerCount value={trades.length} /></div></div>
          <div><div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Win Rate</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}><OdometerCount value={winRate} suffix="%" /></div></div>
          <div><div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Wyckoff / Reapper</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6366f1' }}>{wyckoffCount} / {reapperCount}</div></div>
        </div>
        {isOwner && onOpenLogModal && (
          <button onClick={onOpenLogModal} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '16px', padding: '12px 22px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}>
            <Zap size={18} /> Speed Log Trade
          </button>
        )}
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 25px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
          <div><h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Live Execution Logs</h3><p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Complete trade ledger with reviewer feedback</p></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}><Search size={15} color="#94a3b8" /><input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.84rem', width: '160px' }} /></div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#fafbfc', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 24px', fontWeight: 700 }}>ASSET</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>DIR</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>CHART</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>SETUP</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>RESULT</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>R:R</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>TF</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>SESSION</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>DATE</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No trade records found.</td></tr>
              ) : (
                paginated.map((t) => {
                  const comments = getCommentsByTrade(t.id);
                  const isWin = t.result === 'win';
                  const rVal = t.rMultiple ?? (isWin ? 2 : -1);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fcfdfe')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px 24px', fontWeight: 800, color: '#0f172a' }}>{t.pair}</td>
                      <td style={{ padding: '14px 16px' }}><span style={{ background: t.direction === 'buy' ? '#dcfce7' : '#ffedd5', color: t.direction === 'buy' ? '#15803d' : '#c2410c', padding: '2px 7px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>{t.direction.toUpperCase()}</span></td>
                      <td style={{ padding: '14px 16px' }}><button onClick={() => setSelectedTrade(t)} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '4px 8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}><Eye size={12} color="#0284c7" /> View</button></td>
                      <td style={{ padding: '14px 16px' }}><Badge label={t.setup} variant="primary" size="sm" /></td>
                      <td style={{ padding: '14px 16px' }}><span style={{ background: isWin ? '#dcfce7' : t.result === 'loss' ? '#fee2e2' : '#f1f5f9', color: isWin ? '#15803d' : t.result === 'loss' ? '#b91c1c' : '#475569', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 700 }}>{t.result.toUpperCase()}</span></td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: rVal >= 0 ? '#16a34a' : '#ef4444' }}>{rVal > 0 ? `+${rVal}` : rVal}R</td>
                      <td style={{ padding: '14px 16px' }}><Badge label={t.timeframe} variant="neutral" size="sm" /></td>
                      <td style={{ padding: '14px 16px' }}><Badge label={t.session} variant="session" size="sm" /></td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.78rem' }}>{t.date}</td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => setSelectedTrade(t)} type="button" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}><MessageSquare size={13} /> {comments.length}</button>
                          {isOwner && (
                            <>
                              <button onClick={() => onEditTrade?.(t)} title="Edit Trade" type="button" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}><Edit3 size={15} /></button>
                              <button onClick={() => setDeletingTrade(t)} title="Delete" type="button" style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}><Trash2 size={15} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      </div>
      <TradeFeedbackModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      <ConfirmDeleteModal isOpen={!!deletingTrade} itemTitle={deletingTrade ? `${deletingTrade.pair} (${deletingTrade.date})` : ''} onClose={() => setDeletingTrade(null)} onConfirm={() => deletingTrade && deleteTrade(deletingTrade.id)} />
    </div>
  );
}
