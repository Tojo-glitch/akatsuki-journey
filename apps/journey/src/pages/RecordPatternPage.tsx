import React, { useState } from 'react';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { ChartCategory, ChartEntry, Timeframe, TradingSession } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';
import { DropzoneUpload, CustomSelect } from '@kecha/shared-ui';
import { fileToBase64, compressImage, parseChartImageOCR } from '@kecha/shared-utils';

interface RecordPatternPageProps {
  onBack: () => void;
  onSave: (entry: Omit<ChartEntry, 'id' | 'createdAt'>) => void;
}

const CATEGORIES = [
  { value: 'internal_up_to_down', label: '1. Internal Up to Down' },
  { value: 'internal_down_to_up', label: '2. Internal Down to Up' },
  { value: 'external_uptrend', label: '3. External Uptrend' },
  { value: 'external_downtrend', label: '4. External Downtrend' }
];

export function RecordPatternPage({ onBack, onSave }: RecordPatternPageProps) {
  const { settings, getActiveOptions } = useSettingsStore();
  const activePairs = getActiveOptions('pairs');
  const activeTfs = getActiveOptions('timeframes');
  const activeSessions = getActiveOptions('sessions');

  const [category, setCategory] = useState<ChartCategory>('internal_up_to_down');
  const [pair, setPair] = useState(activePairs[0] || 'EURUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>(activeTfs[2] || activeTfs[0] || 'M15');
  const [session, setSession] = useState<TradingSession>(activeSessions[1] || activeSessions[0] || 'London');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [statusText, setStatusText] = useState('');

  const handleFileUpload = async (file: File) => {
    setStatusText('Auto-scanning chart...');
    try {
      const raw = await fileToBase64(file);
      const compressed = await compressImage(raw);
      setImageUrl(compressed);
      const ocr = await parseChartImageOCR(compressed, settings.sessionTimes);
      if (ocr.pair && activePairs.includes(ocr.pair)) setPair(ocr.pair);
      if (ocr.timeframe && activeTfs.includes(ocr.timeframe)) setTimeframe(ocr.timeframe);
      if (ocr.session && activeSessions.includes(ocr.session)) setSession(ocr.session);
      setStatusText(ocr.pair ? `Detected: ${ocr.pair} ${ocr.timeframe || ''}` : '');
    } finally {
      setTimeout(() => setStatusText(''), 3500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    onSave({ category, pair: pair.toUpperCase().trim(), timeframe, session, imageUrl, notes });
    onBack();
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <button onClick={onBack} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Ninja Journey
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Record Pattern Quest</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>Level 1 Structural Database Collector</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '28px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CustomSelect label="Market Structure Category" value={category} options={CATEGORIES} onChange={(v) => setCategory(v as ChartCategory)} />
          <CustomSelect label="Asset / Pair" value={pair} options={activePairs} onChange={setPair} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <CustomSelect label="Timeframe" value={timeframe} options={activeTfs} onChange={setTimeframe} />
            <CustomSelect label="Session" value={session} options={activeSessions} onChange={setSession} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Context Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Clean displacement with fair value gap..." style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.88rem', resize: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DropzoneUpload imageUrl={imageUrl} onFileSelect={handleFileUpload} onClear={() => setImageUrl('')} statusText={statusText} />
          <button type="submit" disabled={!imageUrl} style={{ backgroundColor: imageUrl ? '#0f172a' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '18px', padding: '14px', fontSize: '0.98rem', fontWeight: 700, cursor: imageUrl ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)' }}>
            <PlusCircle size={18} /> Save Pattern to Level 1
          </button>
        </div>
      </form>
    </div>
  );
}
