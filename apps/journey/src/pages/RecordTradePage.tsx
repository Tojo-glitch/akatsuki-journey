import React, { useState } from 'react';
import { ArrowLeft, Zap } from 'lucide-react';
import { TradeJournalEntry, TradeResult } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';
import { DateTimePicker, DropzoneUpload, CustomSelect } from '@kecha/shared-ui';
import { fileToBase64, compressImage, parseChartImageOCR, determineSessionByTime } from '@kecha/shared-utils';

interface RecordTradePageProps {
  onBack: () => void;
  onSave: (entry: Omit<TradeJournalEntry, 'id' | 'createdAt'>) => void;
}

export function RecordTradePage({ onBack, onSave }: RecordTradePageProps) {
  const { settings, getActiveOptions } = useSettingsStore();
  const activePairs = getActiveOptions('pairs');
  const activeTfs = getActiveOptions('timeframes');
  const activeSessions = getActiveOptions('sessions');
  const activeSetups = getActiveOptions('setups');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:30');
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

  const handleDateTimeChange = (newDate: string, newTime: string) => {
    setDate(newDate);
    setTime(newTime);
    const hour = parseInt(newTime.split(':')[0], 10);
    const autoSession = determineSessionByTime(hour, settings.sessionTimes);
    if (activeSessions.includes(autoSession)) setSession(autoSession);
  };

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
      if (ocr.rMultiple) { setRInput(`${ocr.rMultiple}`); setResult('win'); }
      setStatusText(ocr.pair ? `Detected: ${ocr.pair} ${ocr.timeframe || ''}` : '');
    } finally {
      setTimeout(() => setStatusText(''), 3500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    let finalR = parseFloat(rInput) || 0;
    if (result === 'win' && finalR <= 0) finalR = Math.abs(finalR) || 1;
    if (result === 'loss' && finalR >= 0) finalR = -Math.abs(finalR) || -1;
    onSave({
      date: `${date} ${time}`, pair: pair.toUpperCase().trim(), timeframe, session, setup,
      direction, result, rMultiple: result === 'breakeven' ? 0 : finalR, imageUrl, notes
    });
    onBack();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <button onClick={onBack} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Live Journal
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Live Execution Entry</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>Full Focus Speed Log & Chart Analytics</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '28px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Date & Execution Time</label>
            <DateTimePicker selectedDate={date} selectedTime={time} onChange={handleDateTimeChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <CustomSelect label="Setup Framework" value={setup} options={activeSetups} onChange={setSetup} />
            <CustomSelect label="Asset / Pair" value={pair} options={activePairs} onChange={setPair} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <CustomSelect label="Timeframe" value={timeframe} options={activeTfs} onChange={setTimeframe} />
            <CustomSelect label="Trading Session" value={session} options={activeSessions} onChange={setSession} />
            <CustomSelect label="Direction" value={direction} options={[{ value: 'buy', label: 'BUY' }, { value: 'sell', label: 'SELL' }]} onChange={(v) => setDirection(v as 'buy' | 'sell')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <CustomSelect label="Trade Outcome" value={result} options={[{ value: 'win', label: 'Win' }, { value: 'loss', label: 'Loss' }, { value: 'breakeven', label: 'Breakeven' }]} onChange={(v) => setResult(v as TradeResult)} />
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Realized R:R</label>
              <input type="text" value={rInput} onChange={(e) => setRInput(e.target.value)} placeholder="e.g. 2.5 or -1.0" style={{ width: '100%', boxSizing: 'border-box', padding: '11px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.88rem', fontWeight: 600 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Execution Chart Screenshot</label>
            <DropzoneUpload imageUrl={imageUrl} onFileSelect={handleFileUpload} onClear={() => setImageUrl('')} statusText={statusText} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Analysis & Execution Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Sweep of Asian low into London session Wyckoff accumulation..." style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.88rem', resize: 'none' }} />
          </div>

          <button type="submit" disabled={!imageUrl} style={{ backgroundColor: imageUrl ? '#0f172a' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '18px', padding: '15px', fontSize: '1rem', fontWeight: 700, cursor: imageUrl ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)' }}>
            <Zap size={18} /> Record Live Execution
          </button>
        </div>
      </form>
    </div>
  );
}
