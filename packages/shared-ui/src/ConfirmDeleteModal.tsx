import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  itemTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  itemTitle,
  onClose,
  onConfirm
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" subtitle="Irreversible Action" maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0 6px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <AlertTriangle size={26} />
        </div>

        <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
          Delete record permanently?
        </h4>

        <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
          Are you sure you want to remove <strong style={{ color: '#0f172a' }}>"{itemTitle}"</strong>? This record will be permanently deleted from your journal database.
        </p>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            style={{ flex: 1, padding: '11px', borderRadius: '14px', border: 'none', background: '#ef4444', color: '#ffffff', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
