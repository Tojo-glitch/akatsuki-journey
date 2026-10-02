import React, { useState, useEffect } from 'react';
import { Modal, CustomSelect } from '@kecha/shared-ui';
import { ChartCategory, ChartEntry, Timeframe, TradingSession } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';

interface EditChartModalProps {
  entry: ChartEntry | null;
  onClose: () => void;
  onSave: (id: string, updated: Partial<ChartEntry>) => void;
}

const CATEGORIES: { value: ChartCategory; label: string }[] = [
  { value: 'internal_up_to_down', label: '1. Internal Up to Down' },
  { value: 'internal_down_to_up', label: '2. Internal Down to Up' },
  { value: 'external_uptrend', label: '3. External Uptrend' },
  { value: 'external_downtrend', label: '4. External Downtrend' }
];

export function EditChartModal({ entry, onClose, onSave }: EditChartModalProps) {
  const { getActiveOptions } = useSettingsStore();
  const activePairs = getActiveOptions('pairs');
  const activeTfs = getActiveOptions('timeframes');
  const activeSessions = getActiveOptions('sessions');

  const [category, setCategory] = useState<ChartCategory>('internal_up_to_down');
  const [pair, setPair] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('M15');
  const [session, setSession] = useState<TradingSession>('london');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (entry) {
      setCategory(entry.category);
      setPair(entry.pair);
      setTimeframe(entry.timeframe);
      setSession(entry.session);
      setNotes(entry.notes || '');
    }
  }, [entry]);

  if (!entry) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(entry.id, { category, pair: pair.toUpperCase().trim(), timeframe, session, notes });
    onClose();
  };

  return (
    <Modal isOpen={!!entry} onClose={onClose} title={`Edit Pattern: ${entry.pair}`} subtitle="Update details">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <CustomSelect label="Structure Category" value={category} options={CATEGORIES} onChange={(v) => setCategory(v as ChartCategory)} />
        <CustomSelect label="Asset / Pair" value={pair} options={activePairs} onChange={setPair} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <CustomSelect label="Timeframe" value={timeframe} options={activeTfs} onChange={setTimeframe} />
          <CustomSelect label="Session" value={session} options={activeSessions} onChange={setSession} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Analysis Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
        </div>

        <button type="submit" style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '12px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer' }}>
          Save Changes
        </button>
      </form>
    </Modal>
  );
}
