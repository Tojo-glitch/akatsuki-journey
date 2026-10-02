import React, { useState } from 'react';
import { Modal, CustomSelect, DropzoneUpload } from '@kecha/shared-ui';
import { TradeJournalEntry, TradeResult } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';
import { fileToBase64, compressImage, parseChartImageOCR } from '@kecha/shared-utils';
import { Zap } from 'lucide-react';

interface FastJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<TradeJournalEntry, 'id' | 'createdAt'>) => void;
}

export function FastJournalModal({ isOpen, onClose, onSave }: FastJournalModalProps) {
  const { settings, getActiveOptions } = useSettingsStore();
  const activePairs = getActiveOptions('pairs');
  const activeTfs = getActiveOptions('timeframes');
  const activeSessions = getActiveOptions('sessions');
  const activeSetups = getActiveOptions('setups');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pair, setPair] = useState(activePairs[0] || 'EURUSD');
  const [timeframe, setTimeframe] = useState(activeTfs[2] || activeTfs[0] || 'M15');
  const [session, setSession] = useState(activeSessions[1] || activeSessions[0] || 'London');
  const [setup, setSetup] = useState(activeSetups[0] || 'Wyckoff');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [result, setResult] = useState<TradeResult>('win');
  const [rInput, setRInput] = useState('2.5');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [statusText, setStatusText] = useState('');

  const handleRChange = (val: string) => {
    setRInput(val);
    if (val.trim().startsWith('-') || parseFloat(val) < 0) setResult('loss');
    else if (parseFloat(val) > 0 && result === 'loss') setResult('win');
  };

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
      if (ocr.rMultiple) { setRInput(`${ocr.rMultiple}`); setResult('win'); }
      setStatusText(ocr.pair ? `Detected: ${ocr.pair} ${ocr.timeframe || ''}` : '');
    } finally {
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    let finalR = parseFloat(rInput) || 0;
    if (result === 'win' && finalR <= 0) finalR = Math.abs(finalR) || 1;
    if (result === 'loss' && finalR >= 0) finalR = -Math.abs(finalR) || -1;
    onSave({
      date, pair: pair.toUpperCase().trim(), timeframe, session, setup, direction, result,
      rMultiple: result === 'breakeven' ? 0 : finalR, imageUrl, notes
    });
    setImageUrl(''); setNotes(''); onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fast Live Trade Entry" subtitle="Speed Execution Record">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} /></div>
          <CustomSelect label="Setup" value={setup} options={activeSetups} onChange={setSetup} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <CustomSelect label="Pair" value={pair} options={activePairs} onChange={setPair} />
          <CustomSelect label="Timeframe" value={timeframe} options={activeTfs} onChange={setTimeframe} />
          <CustomSelect label="Session" value={session} options={activeSessions} onChange={setSession} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <CustomSelect label="Direction" value={direction} options={[{ value: 'buy', label: 'BUY' }, { value: 'sell', label: 'SELL' }]} onChange={(v) => setDirection(v as 'buy' | 'sell')} />
          <CustomSelect label="Result" value={result} options={[{ value: 'win', label: 'Win' }, { value: 'loss', label: 'Loss' }, { value: 'breakeven', label: 'BE' }]} onChange={(v) => setResult(v as TradeResult)} />
          <div><label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>R:R</label><input type="text" value={rInput} onChange={(e) => handleRChange(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1' }} /></div>
        </div>
        <DropzoneUpload imageUrl={imageUrl} onFileSelect={handleFileUpload} onClear={() => setImageUrl('')} statusText={statusText} />
        <div><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (Optional)" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} /></div>
        <button type="submit" disabled={!imageUrl} style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Zap size={16} /> Quick Save Trade</button>
      </form>
    </Modal>
  );
}
