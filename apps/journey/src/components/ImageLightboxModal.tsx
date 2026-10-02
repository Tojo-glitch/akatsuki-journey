import { Modal, Badge } from '@kecha/shared-ui';
import { ChartEntry } from '@kecha/shared-types';

interface ImageLightboxModalProps {
  entry: ChartEntry | null;
  onClose: () => void;
}

export function ImageLightboxModal({ entry, onClose }: ImageLightboxModalProps) {
  if (!entry) return null;

  return (
    <Modal isOpen={!!entry} onClose={onClose} title={`${entry.pair} — ${entry.timeframe}`} subtitle={`Recorded during ${entry.session.toUpperCase()} session`} maxWidth="840px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0f172a', maxHeight: '550px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={entry.imageUrl} alt={entry.pair} style={{ width: '100%', height: 'auto', maxHeight: '550px', objectFit: 'contain' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge label={entry.category.replace(/_/g, ' ')} variant="primary" size="md" />
          <Badge label={`Session: ${entry.session}`} variant="session" size="md" />
          <Badge label={`Timeframe: ${entry.timeframe}`} variant="neutral" size="md" />
        </div>

        {entry.notes && (
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', color: '#334155' }}>
            <strong>Analysis Notes:</strong> {entry.notes}
          </div>
        )}
      </div>
    </Modal>
  );
}
