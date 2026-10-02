import { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '@kecha/shared-auth';
import { useJourneyStore } from '../store/useJourneyStore';
import { useJournalStore } from '../store/useJournalStore';
import { SettingsSection } from './SettingsSection';
import { RotateCcw, KeyRound, ShieldCheck, Download } from 'lucide-react';
import { LoadingButton } from '@kecha/shared-ui';

export function SettingsView() {
  const { settings, addOption, toggleOption, removeOption, resetDefaults } = useSettingsStore();
  const { isOwner, updatePin } = useAuthStore();
  const { entries: patternEntries } = useJourneyStore();
  const { trades, comments } = useJournalStore();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');

  const handlePinChange = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const success = updatePin(oldPin, newPin);
    if (!success) throw new Error('Invalid PIN');
    setOldPin(''); setNewPin('');
  };

  const handleExportBackup = () => {
    const fullBackup = {
      version: '1.0',
      exportedAt: Date.now(),
      patterns: patternEntries,
      trades,
      comments,
      settings
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nostoi-journey-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '28px', padding: '36px 40px', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>System Parameters</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748b' }}>Configure assets, active timeframes, sessions, and backup recovery</p>
          </div>
          {isOwner && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleExportBackup} type="button" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '12px', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} /> Export Backup (.json)
              </button>
              <button onClick={resetDefaults} type="button" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '12px', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          )}
        </div>

        <SettingsSection title="Currency Pairs & Assets" description="Manage tradable symbols. Toggle off to temporarily hide from entry forms." items={settings.pairs} isOwner={isOwner} onAdd={(val) => addOption('pairs', val)} onToggle={(id) => toggleOption('pairs', id)} onRemove={(id) => removeOption('pairs', id)} placeholder="e.g. XAUUSD" />
        <SettingsSection title="Analysis Timeframes" description="Active timeframes in forms and filters." items={settings.timeframes} isOwner={isOwner} onAdd={(val) => addOption('timeframes', val)} onToggle={(id) => toggleOption('timeframes', id)} onRemove={(id) => removeOption('timeframes', id)} placeholder="e.g. M15" />
        <SettingsSection title="Trading Sessions" description="Active market sessions." items={settings.sessions} isOwner={isOwner} onAdd={(val) => addOption('sessions', val)} onToggle={(id) => toggleOption('sessions', id)} onRemove={(id) => removeOption('sessions', id)} placeholder="e.g. London" />
        <SettingsSection title="Strategy Setups" description="Trading models tracked in battle matrix." items={settings.setups} isOwner={isOwner} onAdd={(val) => addOption('setups', val)} onToggle={(id) => toggleOption('setups', id)} onRemove={(id) => removeOption('setups', id)} placeholder="e.g. Wyckoff" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '32px', padding: '28px 0' }}>
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><KeyRound size={17} /> Security PIN</h4>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>Owner authorization PIN.</p>
          </div>
          <div>
            {isOwner ? (
              <div style={{ display: 'flex', gap: '10px', maxWidth: '380px' }}>
                <input type="password" maxLength={8} value={oldPin} onChange={(e) => setOldPin(e.target.value)} placeholder="Current PIN" style={{ width: '110px', padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                <input type="password" maxLength={8} value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="New PIN" style={{ flex: 1, padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }} />
                <LoadingButton onAction={handlePinChange} disabled={!oldPin || !newPin} style={{ padding: '10px 18px', borderRadius: '14px' }}>Save</LoadingButton>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem' }}><ShieldCheck size={16} /> Unlock Owner Mode to change PIN.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
