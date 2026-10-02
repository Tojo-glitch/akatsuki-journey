import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { TradeJournalEntry, TradeResult } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';
import { DateTimePicker, DropzoneUpload, CustomSelect, LoadingButton } from '@kecha/shared-ui';
import { fileToBase64, compressImage, parseChartImageOCR, determineSessionByTime } from '@kecha/shared-utils';

interface EditTradePageProps {
  trade: TradeJournalEntry;
  onBack: () => void;
  onSave: (id: string, updated: Partial<TradeJournalEntry>) => void;
}

export function EditTradePage({ trade, onBack, onSave }: EditTradePageProps) {
  const { settings, getActiveOptions } = useSettingsStore();
  const activePairs = getActiveOptions('pairs');
  const activeTfs = getActiveOptions('timeframes');
  const activeSessions = getActiveOptions('sessions');
  const activeSetups = getActiveOptions('setups');

  const parts = trade.date.split(' ');
  const [date, setDate] = useState(parts[0] || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(parts[1] || '14:00');
  const [pair, setPair] = useState(trade.pair);
  const [timeframe, setTimeframe] = useState(trade.timeframe);
  const [session, setSession] = useState(trade.session);
  const [setup, setSetup] = useState(trade.setup);
  const [direction, setDirection] = useState<'buy' | 'sell'>(trade.direction);
  const [result, setResult] = useState<TradeResult>(trade.result);
  const [rInput, setRInput] = useState(`${trade.rMultiple ?? (trade.result === 'win' ? 2 : -1)}`);
  const [imageUrl, setImageUrl] = useState(trade.imageUrl);
  const [notes, setNotes] = useState(trade.notes || '');
  const [statusText, setStatusText] = useState('');

  const handleDateTimeChange = (newDate: string, newTime: string) => {
    setDate(newDate); setTime(newTime);
    const hour = parseInt(newTime.split(':')[0], 10);
    const autoSession = determineSessionByTime(hour, settings.sessionTimes);
    if (activeSessions.includes(autoSession)) setSession(autoSession);
  };

  const handleFileUpload = async (file: File) => {
    setStatusText('Scanning new chart...');
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

  const handleExecuteSave = async () => {
    if (!imageUrl) return;
    await new Promise((resolve) => setTimeout(resolve, 600));
    let finalR = parseFloat(rInput) || 0;
    if (result === 'win' && finalR <= 0) finalR = Math.abs(finalR) || 1;
    if (result === 'loss' && finalR >= 0) finalR = -Math.abs(finalR) || -1;
    onSave(trade.id, {
      date: `${date} ${time}`, pair: pair.toUpperCase().trim(), timeframe, session, setup,
      direction, result, rMultiple: result === 'breakeven' ? 0 : finalR, imageUrl, notes
    });
    setTimeout(() => onBack(), 700);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <button onClick={onBack} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Live Journal
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Edit Trade: {trade.pair}</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>Update execution parameters or replace chart image</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '28px', alignItems: 'start' }}>
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
              <input type="text" value={rInput} onChange={(e) => setRInput(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '11px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.88rem', fontWeight: 600 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Execution Chart (Replace if needed)</label>
            <DropzoneUpload imageUrl={imageUrl} onFileSelect={handleFileUpload} onClear={() => setImageUrl('')} statusText={statusText} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Analysis & Execution Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.88rem', resize: 'none' }} />
          </div>

          <LoadingButton
            onAction={handleExecuteSave}
            disabled={!imageUrl}
            pendingLabel="Saving Changes..."
            successLabel="Changes Saved ✓"
            style={{ width: '100%', padding: '14px', borderRadius: '18px' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Save size={18} /> Save Changes</span>
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
