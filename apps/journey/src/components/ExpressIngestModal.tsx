import { useState } from 'react';
import { Modal, CustomSelect, LoadingButton } from '@kecha/shared-ui';
import { ChartCategory, Timeframe, TradingSession } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { fileToBase64, compressImage } from '@kecha/shared-utils';
import { Sparkles, ImagePlus } from 'lucide-react';

interface ExpressIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: ChartCategory;
}

const CATEGORIES: { value: ChartCategory; label: string }[] = [
  { value: 'internal_up_to_down', label: '1. Internal Up to Down (100 Target)' },
  { value: 'internal_down_to_up', label: '2. Internal Down to Up (100 Target)' },
  { value: 'external_uptrend', label: '3. External Uptrend (100 Target)' },
  { value: 'external_downtrend', label: '4. External Downtrend (100 Target)' }
];

export function ExpressIngestModal({ isOpen, onClose, defaultCategory = 'internal_up_to_down' }: ExpressIngestModalProps) {
  const { getActiveOptions } = useSettingsStore();
  const { addBatchEntries } = useJourneyStore();
  const [category, setCategory] = useState<ChartCategory>(defaultCategory);
  const [pair, setPair] = useState(getActiveOptions('pairs')[0] || 'EURUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('M15');
  const [session, setSession] = useState<TradingSession>('London');
  const [files, setFiles] = useState<File[]>([]);
  const [progressText, setProgressText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const handleStartIngest = async () => {
    if (files.length === 0) return;
    const batchEntries = [];
    for (let i = 0; i < files.length; i++) {
      setProgressText(`Processing ${i + 1} of ${files.length} charts...`);
      const raw = await fileToBase64(files[i]);
      const compressed = await compressImage(raw);
      batchEntries.push({
        category,
        pair: pair.toUpperCase().trim(),
        timeframe,
        session,
        imageUrl: compressed,
        notes: `Express Ingest #${i + 1}`
      });
    }
    addBatchEntries(batchEntries);
    setProgressText('Complete!');
    setTimeout(() => {
      setFiles([]);
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="100-Photo Express Ingest" subtitle="Fast-track Level 1 progression from your photo album" maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <CustomSelect label="Select Target Category" value={category} options={CATEGORIES} onChange={(v) => setCategory(v as ChartCategory)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <CustomSelect label="Asset / Pair" value={pair} options={getActiveOptions('pairs')} onChange={setPair} />
          <CustomSelect label="Timeframe" value={timeframe} options={getActiveOptions('timeframes')} onChange={setTimeframe} />
          <CustomSelect label="Session" value={session} options={getActiveOptions('sessions')} onChange={setSession} />
        </div>

        <label style={{ border: '2px dashed #0ea5e9', borderRadius: '18px', padding: '28px 16px', background: '#f0f9ff', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ImagePlus size={32} color="#0284c7" />
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>
            {files.length > 0 ? `${files.length} Photos Selected` : 'Tap to Select 100 Photos from iPhone / iPad'}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Select all your charts in one go from library</span>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
        </label>

        {progressText && (
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7', textAlign: 'center' }}>
            {progressText}
          </div>
        )}

        <LoadingButton
          onAction={handleStartIngest}
          disabled={files.length === 0}
          pendingLabel={progressText || "Importing..."}
          successLabel="All Photos Added ✓"
          style={{ width: '100%', padding: '14px', borderRadius: '16px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} /> Import All {files.length} Charts to {category.replace(/_/g, ' ')}
          </span>
        </LoadingButton>
      </div>
    </Modal>
  );
}
