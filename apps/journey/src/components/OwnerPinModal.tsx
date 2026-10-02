import { useState } from 'react';
import { Modal, PinOtpInput } from '@kecha/shared-ui';
import { useAuthStore } from '@kecha/shared-auth';
import { KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';

interface OwnerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OwnerPinModal({ isOpen, onClose }: OwnerPinModalProps) {
  const { unlockOwner, ownerPin } = useAuthStore();
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');

  const handleCompletePin = (pin: string) => {
    const success = unlockOwner(pin);
    if (success) {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 500);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1200);
    }
    return success;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Owner Mode Authorization" subtitle="Enter your 4-digit Security PIN" maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px 0 8px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '20px',
          background: status === 'success' ? '#dcfce7' : status === 'error' ? '#fee2e2' : '#f1f5f9',
          color: status === 'success' ? '#15803d' : status === 'error' ? '#ef4444' : '#0f172a',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          transition: 'all 0.3s ease'
        }}>
          {status === 'success' ? <ShieldCheck size={28} /> : status === 'error' ? <AlertCircle size={28} /> : <KeyRound size={26} />}
        </div>

        <p style={{ margin: '0 0 24px', fontSize: '0.84rem', color: '#64748b' }}>
          Try <strong>{ownerPin || '1234'}</strong>, or your configured PIN.
        </p>

        <PinOtpInput length={4} onComplete={handleCompletePin} status={status} />

        <div style={{ height: '24px', marginTop: '16px' }}>
          {status === 'error' && (
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>
              Incorrect PIN. Please try again.
            </span>
          )}
          {status === 'success' && (
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#16a34a' }}>
              Owner Mode Unlocked ✓
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}
