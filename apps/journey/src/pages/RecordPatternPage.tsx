import { useState } from 'react';
import { ArrowLeft, Layers, Sparkles } from 'lucide-react';
import { ChartCategory, Timeframe, TradingSession } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { DropzoneUpload, CustomSelect, LoadingButton } from '@kecha/shared-ui';
import { fileToBase64, compressImage, parseChartImageOCR } from '@kecha/shared-utils';

interface RecordPatternPageProps {
  onBack: () => void;
  onOpenBatch?: () => void;
}

const CATEGORIES: { value: ChartCategory; label: string }[] = [
  { value: 'internal_up_to_down', label: '1. Internal Up to Down' },
  { value: 'internal_down_to_up', label: '2. Internal Down to Up' },
  { value: 'external_uptrend', label: '3. External Uptrend' },
  { value: 'external_downtrend', label: '4. External Downtrend' }
];

export function RecordPatternPage({ onBack, onOpenBatch }: RecordPatternPageProps) {
  const { settings, getActiveOptions } = useSettingsStore();
  const { addBatchEntries } = useJourneyStore();
  const activePairs = getActiveOptions('pairs');
  const activeTfs = getActiveOptions('timeframes');
  const activeSessions = getActiveOptions('sessions');

  const [category, setCategory] = useState<ChartCategory>('internal_up_to_down');
  const [pair, setPair] = useState(activePairs[0] || 'EURUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>(activeTfs[2] || activeTfs[0] || 'M15');
  const [session, setSession] = useState<TradingSession>(activeSessions[1] || activeSessions[0] || 'London');
  const [occurrenceCount, setOccurrenceCount] = useState(1);
  const [sequenceLabel, setSequenceLabel] = useState('');
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
      if (ocr.occurrences) {
        setOccurrenceCount(ocr.occurrences);
        if (ocr.setupLabel) setSequenceLabel(ocr.setupLabel);
      }
      setStatusText(ocr.setupLabel ? `✨ Found: ${ocr.setupLabel} (${ocr.occurrences} setups)` : ocr.pair ? `Detected: ${ocr.pair}` : '');
    } finally {
      setTimeout(() => setStatusText(''), 3500);
    }
  };

  const handleExecuteSave = async () => {
    if (!imageUrl || occurrenceCount < 1) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
    const entriesToSave = Array.from({ length: occurrenceCount }).map((_, i) => ({
      category,
      pair: pair.toUpperCase().trim(),
      timeframe,
      session,
      imageUrl,
      notes: sequenceLabel ? `${sequenceLabel} (Setup #${i + 1}) ${notes}` : notes
    }));
    addBatchEntries(entriesToSave);
    setTimeout(() => onBack(), 600);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}><ArrowLeft size={16} /> Back to Quests</button>
        {onOpenBatch && <button onClick={onOpenBatch} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px 14px', fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}><Layers size={15} /> Batch Upload 10-100 Images</button>}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Record Pattern Quest</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>If 1 chart has multiple setups (e.g. 100/2-3-4), set count to log all in 1 click</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '28px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CustomSelect label="Structure Category" value={category} options={CATEGORIES} onChange={(v) => setCategory(v as ChartCategory)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Setups Count in Image</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} type="button" onClick={() => setOccurrenceCount(num)} style={{ flex: 1, padding: '10px 0', borderRadius: '12px', border: occurrenceCount === num ? '2px solid #0f172a' : '1px solid #e2e8f0', background: occurrenceCount === num ? '#0f172a' : '#ffffff', color: occurrenceCount === num ? '#ffffff' : '#334155', fontWeight: 700, cursor: 'pointer' }}>{num}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Sequence (e.g. 100/2-3-4)</label>
              <input type="text" value={sequenceLabel} onChange={(e) => setSequenceLabel(e.target.value)} placeholder="e.g. 100/2-3-4" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }} />
            </div>
          </div>
          <CustomSelect label="Asset / Pair" value={pair} options={activePairs} onChange={setPair} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <CustomSelect label="Timeframe" value={timeframe} options={activeTfs} onChange={setTimeframe} />
            <CustomSelect label="Session" value={session} options={activeSessions} onChange={setSession} />
          </div>
          <div><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context notes..." style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }} /></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DropzoneUpload imageUrl={imageUrl} onFileSelect={handleFileUpload} onClear={() => setImageUrl('')} statusText={statusText} />
          <LoadingButton onAction={handleExecuteSave} disabled={!imageUrl} pendingLabel={`Recording +${occurrenceCount}...`} successLabel={`+${occurrenceCount} Logged ✓`} style={{ width: '100%', padding: '14px', borderRadius: '18px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Sparkles size={18} /> Save (+{occurrenceCount} to 100 target)</span>
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
