import { useState } from 'react';
import { ArrowLeft, Layers } from 'lucide-react';
import { ChartCategory } from '@kecha/shared-types';
import { useSettingsStore } from '../store/useSettingsStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { fileToBase64, compressImage, parseChartImageOCR } from '@kecha/shared-utils';
import { LoadingButton } from '@kecha/shared-ui';

interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  pair: string;
  timeframe: string;
  session: string;
  categories: ChartCategory[];
}

export function BatchUploadPage({ onBack }: { onBack: () => void }) {
  const { settings, getActiveOptions } = useSettingsStore();
  const { addBatchEntries } = useJourneyStore();
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsProcessing(true);
    const activePairs = getActiveOptions('pairs');
    const newItems: BatchItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgressText(`Processing ${i + 1}/${files.length}...`);
      const raw = await fileToBase64(file);
      const compressed = await compressImage(raw);
      const ocr = await parseChartImageOCR(compressed, settings.sessionTimes);

      newItems.push({
        id: `batch_${Date.now()}_${i}`,
        file,
        previewUrl: compressed,
        pair: ocr.pair && activePairs.includes(ocr.pair) ? ocr.pair : activePairs[0] || 'EURUSD',
        timeframe: ocr.timeframe || 'M15',
        session: ocr.session || 'London',
        categories: ['internal_up_to_down']
      });
    }

    setItems([...items, ...newItems]);
    setIsProcessing(false);
    setProgressText('');
  };

  const handleSaveAll = async () => {
    if (items.length === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 600));
    const allEntries = items.flatMap((item) =>
      item.categories.map((cat) => ({
        category: cat,
        pair: item.pair,
        timeframe: item.timeframe,
        session: item.session,
        imageUrl: item.previewUrl
      }))
    );
    addBatchEntries(allEntries);
    setTimeout(() => onBack(), 700);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <button onClick={onBack} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Pattern Quest
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Batch Pattern Uploader</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>Drop 10-100 chart screenshots at once for instant Level 1 progression</p>
        </div>
        {items.length > 0 && (
          <LoadingButton onAction={handleSaveAll} pendingLabel="Saving All..." successLabel="All Saved ✓" style={{ padding: '12px 24px', borderRadius: '16px' }}>
            Save All ({items.length} Charts)
          </LoadingButton>
        )}
      </div>

      <label style={{ border: '2px dashed #0ea5e9', borderRadius: '20px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f0f9ff', textAlign: 'center', marginBottom: '24px' }}>
        <Layers size={32} color="#0284c7" />
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '10px' }}>
          {isProcessing ? progressText : 'Select or Drop 10-100 Images at once'}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Auto-scan pair, timeframe, and session for all charts</span>
        <input type="file" accept="image/*" multiple onChange={handleMultipleFiles} style={{ display: 'none' }} />
      </label>

      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {items.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#ffffff', borderRadius: '18px', overflow: 'hidden', border: '1px solid #f1f5f9', padding: '10px' }}>
              <img src={item.previewUrl} alt={item.pair} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '12px' }} />
              <div style={{ padding: '8px 4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>{item.pair}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.timeframe} • {item.session}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
