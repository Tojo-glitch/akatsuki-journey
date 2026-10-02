import React, { useState } from 'react';
import { Modal } from '@kecha/shared-ui';
import { useAuthStore } from '@kecha/shared-auth';
import { KeyRound } from 'lucide-react';

interface OwnerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OwnerPinModal({ isOpen, onClose }: OwnerPinModalProps) {
  const { unlockOwner } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockOwner(pin);
    if (success) {
      setPin('');
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Owner Mode Authorization" subtitle="Enter your Security PIN" maxWidth="400px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#f1f5f9', color: '#0f172a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
            <KeyRound size={24} />
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Default PIN: <strong>1234</strong> (Customizable in Settings)</p>
        </div>

        <div>
          <input
            type="password"
            autoFocus
            maxLength={8}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="Enter 4-digit PIN"
            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.3em', padding: '12px', borderRadius: '14px', border: error ? '2px solid #ef4444' : '1px solid #cbd5e1', outline: 'none' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', margin: '6px 0 0' }}>Incorrect PIN. Please try again.</p>}
        </div>

        <button type="submit" style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '12px', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer' }}>
          Unlock Owner Mode
        </button>
      </form>
    </Modal>
  );
}
