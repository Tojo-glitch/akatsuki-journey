import React, { useState } from 'react';
import { Modal, CustomSelect, DropzoneUpload } from '@kecha/shared-ui';
import { ChartCategory, Timeframe, TradingSession } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';
import { fileToBase64, compressImage, parseChartImageOCR } from '@kecha/shared-utils';
import { PlusCircle } from 'lucide-react';

interface AddChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: {
    category: ChartCategory;
    pair: string;
    timeframe: Timeframe;
    session: TradingSession;
    imageUrl: string;
    notes?: string;
  }) => void;
}

const CATEGORIES: { value: ChartCategory; label: string }[] = [
  { value: 'internal_up_to_down', label: '1. Internal Up to Down' },
  { value: 'internal_down_to_up', label: '2. Internal Down to Up' },
  { value: 'external_uptrend', label: '3. External Uptrend' },
  { value: 'external_downtrend', label: '4. External Downtrend' }
];

export function AddChartModal({ isOpen, onClose, onSave }: AddChartModalProps) {
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
    setStatusText('Scanning chart...');
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
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    onSave({ category, pair: pair.toUpperCase().trim(), timeframe, session, imageUrl, notes });
    setImageUrl(''); setNotes(''); onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Pattern Screenshot" subtitle="Level 1 Quest Entry">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <CustomSelect label="Structure Category" value={category} options={CATEGORIES} onChange={(v) => setCategory(v as ChartCategory)} />
        <CustomSelect label="Asset / Pair" value={pair} options={activePairs} onChange={setPair} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <CustomSelect label="Timeframe" value={timeframe} options={activeTfs} onChange={setTimeframe} />
          <CustomSelect label="Session" value={session} options={activeSessions} onChange={setSession} />
        </div>
        <DropzoneUpload imageUrl={imageUrl} onFileSelect={handleFileUpload} onClear={() => setImageUrl('')} statusText={statusText} />
        <div><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context Notes (Optional)" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} /></div>
        <button type="submit" disabled={!imageUrl} style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '12px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><PlusCircle size={16} /> Save to Collection</button>
      </form>
    </Modal>
  );
}
