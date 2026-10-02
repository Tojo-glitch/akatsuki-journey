import React, { useState, useEffect } from 'react';
import { Modal, CustomSelect } from '@kecha/shared-ui';
import { TradeJournalEntry, TradeResult } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';

interface EditJournalModalProps {
  trade: TradeJournalEntry | null;
  onClose: () => void;
  onSave: (id: string, updated: Partial<TradeJournalEntry>) => void;
}

export function EditJournalModal({ trade, onClose, onSave }: EditJournalModalProps) {
  const { getActiveOptions } = useSettingsStore();
  const activePairs = getActiveOptions('pairs');
  const activeTfs = getActiveOptions('timeframes');
  const activeSessions = getActiveOptions('sessions');
  const activeSetups = getActiveOptions('setups');

  const [date, setDate] = useState('');
  const [pair, setPair] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [session, setSession] = useState('');
  const [setup, setSetup] = useState('');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [result, setResult] = useState<TradeResult>('win');
  const [rMultiple, setRMultiple] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (trade) {
      setDate(trade.date); setPair(trade.pair); setTimeframe(trade.timeframe);
      setSession(trade.session); setSetup(trade.setup); setDirection(trade.direction);
      setResult(trade.result); setRMultiple(`${trade.rMultiple ?? 2}`); setNotes(trade.notes || '');
    }
  }, [trade]);

  if (!trade) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(trade.id, {
      date, pair: pair.toUpperCase().trim(), timeframe, session, setup, direction, result,
      rMultiple: parseFloat(rMultiple) || 0, notes
    });
    onClose();
  };

  return (
    <Modal isOpen={!!trade} onClose={onClose} title={`Edit Trade: ${trade.pair}`} subtitle="Update Live Execution Record">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Date</label>
            <input type="date" value={date.split(' ')[0]} onChange={(e) => setDate(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
          </div>
          <CustomSelect label="Setup" value={setup} options={activeSetups} onChange={setSetup} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <CustomSelect label="Asset / Pair" value={pair} options={activePairs} onChange={setPair} />
          <CustomSelect label="Timeframe" value={timeframe} options={activeTfs} onChange={setTimeframe} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <CustomSelect label="Session" value={session} options={activeSessions} onChange={setSession} />
          <CustomSelect label="Result" value={result} options={[{ value: 'win', label: 'Win' }, { value: 'loss', label: 'Loss' }, { value: 'breakeven', label: 'BE' }]} onChange={(v) => setResult(v as TradeResult)} />
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>R:R</label>
            <input type="number" step="0.1" value={rMultiple} onChange={(e) => setRMultiple(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
        </div>

        <button type="submit" style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '12px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer' }}>
          Save Changes
        </button>
      </form>
    </Modal>
  );
}
