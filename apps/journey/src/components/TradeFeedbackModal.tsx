import React, { useState } from 'react';
import { Modal, Badge } from '@kecha/shared-ui';
import { TradeJournalEntry } from '@kecha/shared-types';
import { useJournalStore } from '../store/useJournalStore';
import { MessageSquare, Send } from 'lucide-react';

interface TradeFeedbackModalProps {
  trade: TradeJournalEntry | null;
  onClose: () => void;
}

export function TradeFeedbackModal({ trade, onClose }: TradeFeedbackModalProps) {
  const { getCommentsByTrade, addComment } = useJournalStore();
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');

  if (!trade) return null;
  const comments = getCommentsByTrade(trade.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment(trade.id, authorName, content);
    setContent('');
  };

  return (
    <Modal isOpen={!!trade} onClose={onClose} title={`${trade.pair} — ${trade.setup} (${trade.result.toUpperCase()})`} subtitle="Trade Analysis & Community Feedback" maxWidth="720px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0f172a', maxHeight: '380px' }}>
          <img src={trade.imageUrl} alt={trade.pair} style={{ width: '100%', height: 'auto', maxHeight: '380px', objectFit: 'contain' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge label={trade.setup} variant="primary" size="md" />
          <Badge label={trade.direction.toUpperCase()} variant={trade.direction === 'buy' ? 'success' : 'warning'} size="md" />
          <Badge label={`Result: ${trade.result}`} variant={trade.result === 'win' ? 'success' : 'neutral'} size="md" />
          <Badge label={`Session: ${trade.session}`} variant="session" size="md" />
        </div>

        {trade.notes && (
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', color: '#334155' }}>
            <strong>Trader Note:</strong> {trade.notes}
          </div>
        )}

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} /> Community Feedback & Critiques ({comments.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', marginBottom: '14px' }}>
            {comments.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>No feedback yet. Be the first mentor/trader to comment!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{c.authorName}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569' }}>{c.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="Your Name (e.g. Mentor Kecha)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Write helpful critique or note for improvement..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <button type="submit" style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                <Send size={14} /> Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
