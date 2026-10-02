import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '@kecha/shared-auth';
import { SettingsSection } from './SettingsSection';
import { RotateCcw, KeyRound, Check, ShieldCheck } from 'lucide-react';

export function SettingsView() {
  const { settings, addOption, toggleOption, removeOption, resetDefaults } = useSettingsStore();
  const { isOwner, updatePin } = useAuthStore();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (updatePin(oldPin, newPin)) {
      setPinSuccess(true); setOldPin(''); setNewPin('');
      setTimeout(() => setPinSuccess(false), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '28px', padding: '36px 40px', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>System Parameters</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748b' }}>Configure assets, active timeframes, sessions, and security access</p>
          </div>
          {isOwner && (
            <button
              onClick={resetDefaults}
              type="button"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '12px', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Reset Defaults
            </button>
          )}
        </div>

        <SettingsSection
          title="Currency Pairs & Assets"
          description="Manage tradable symbols. Toggle off to temporarily hide from entry forms without deleting."
          items={settings.pairs}
          isOwner={isOwner}
          onAdd={(val) => addOption('pairs', val)}
          onToggle={(id) => toggleOption('pairs', id)}
          onRemove={(id) => removeOption('pairs', id)}
          placeholder="e.g. XAUUSD, NAS100"
        />

        <SettingsSection
          title="Analysis Timeframes"
          description="Choose which timeframes are active across chart forms and filter pills."
          items={settings.timeframes}
          isOwner={isOwner}
          onAdd={(val) => addOption('timeframes', val)}
          onToggle={(id) => toggleOption('timeframes', id)}
          onRemove={(id) => removeOption('timeframes', id)}
          placeholder="e.g. M3, H2"
        />

        <SettingsSection
          title="Trading Sessions"
          description="Active market sessions for automatic time calculation and performance attribution."
          items={settings.sessions}
          isOwner={isOwner}
          onAdd={(val) => addOption('sessions', val)}
          onToggle={(id) => toggleOption('sessions', id)}
          onRemove={(id) => removeOption('sessions', id)}
          placeholder="e.g. Frankfurt, Sydney"
        />

        <SettingsSection
          title="Strategy Setup Frameworks"
          description="Trading models tracked in your statistical expectancy battle matrix."
          items={settings.setups}
          isOwner={isOwner}
          onAdd={(val) => addOption('setups', val)}
          onToggle={(id) => toggleOption('setups', id)}
          onRemove={(id) => removeOption('setups', id)}
          placeholder="e.g. ICT Silver Bullet"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '32px', padding: '28px 0' }}>
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={17} /> Owner Security PIN
            </h4>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
              PIN authorization protects record creation, edits, and parameter changes.
            </p>
          </div>

          <div>
            {isOwner ? (
              <form onSubmit={handlePinChange} style={{ display: 'flex', gap: '10px', maxWidth: '380px' }}>
                <input type="password" maxLength={8} value={oldPin} onChange={(e) => setOldPin(e.target.value)} placeholder="Current PIN" required style={{ width: '110px', padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                <input type="password" maxLength={8} value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="New 4-digit PIN" required style={{ flex: 1, padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                <button type="submit" style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '0 16px', fontWeight: 600, cursor: 'pointer' }}>
                  {pinSuccess ? <Check size={16} color="#4ade80" /> : 'Save'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem' }}>
                <ShieldCheck size={16} /> Unlock Owner Mode to update security credentials.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
