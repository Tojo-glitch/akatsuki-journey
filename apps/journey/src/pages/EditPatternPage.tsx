import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { ChartCategory, ChartEntry, Timeframe, TradingSession } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';
import { DropzoneUpload, CustomSelect, LoadingButton } from '@kecha/shared-ui';
import { fileToBase64, compressImage, parseChartImageOCR } from '@kecha/shared-utils';

interface EditPatternPageProps {
  entry: ChartEntry;
  onBack: () => void;
  onSave: (id: string, updated: Partial<ChartEntry>) => void;
}

const CATEGORIES = [
  { value: 'internal_up_to_down', label: '1. Internal Up to Down' },
  { value: 'internal_down_to_up', label: '2. Internal Down to Up' },
  { value: 'external_uptrend', label: '3. External Uptrend' },
  { value: 'external_downtrend', label: '4. External Downtrend' }
];

export function EditPatternPage({ entry, onBack, onSave }: EditPatternPageProps) {
  const { settings, getActiveOptions } = useSettingsStore();
  const activePairs = getActiveOptions('pairs');
  const activeTfs = getActiveOptions('timeframes');
  const activeSessions = getActiveOptions('sessions');

  const [category, setCategory] = useState<ChartCategory>(entry.category);
  const [pair, setPair] = useState(entry.pair);
  const [timeframe, setTimeframe] = useState<Timeframe>(entry.timeframe);
  const [session, setSession] = useState<TradingSession>(entry.session);
  const [imageUrl, setImageUrl] = useState(entry.imageUrl);
  const [notes, setNotes] = useState(entry.notes || '');
  const [statusText, setStatusText] = useState('');

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
      setStatusText(ocr.pair ? `Detected: ${ocr.pair} ${ocr.timeframe || ''}` : '');
    } finally {
      setTimeout(() => setStatusText(''), 3500);
    }
  };

  const handleExecuteSave = async () => {
    if (!imageUrl) return;
    await new Promise((resolve) => setTimeout(resolve, 600));
    onSave(entry.id, { category, pair: pair.toUpperCase().trim(), timeframe, session, imageUrl, notes });
    setTimeout(() => onBack(), 700);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <button onClick={onBack} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Ninja Journey
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Edit Pattern: {entry.pair}</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>Update pattern classification or replace chart screenshot</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '28px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CustomSelect label="Market Structure Category" value={category} options={CATEGORIES} onChange={(v) => setCategory(v as ChartCategory)} />
          <CustomSelect label="Asset / Pair" value={pair} options={activePairs} onChange={setPair} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <CustomSelect label="Timeframe" value={timeframe} options={activeTfs} onChange={setTimeframe} />
            <CustomSelect label="Session" value={session} options={activeSessions} onChange={setSession} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Context Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context notes..." style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.88rem', resize: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DropzoneUpload imageUrl={imageUrl} onFileSelect={handleFileUpload} onClear={() => setImageUrl('')} statusText={statusText} />
          <LoadingButton
            onAction={handleExecuteSave}
            disabled={!imageUrl}
            pendingLabel="Updating Pattern..."
            successLabel="Pattern Updated ✓"
            style={{ width: '100%', padding: '14px', borderRadius: '18px' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Save size={18} /> Save Changes</span>
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
