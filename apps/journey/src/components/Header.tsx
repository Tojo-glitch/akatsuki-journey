import { PlusCircle, Zap, ShieldCheck, Eye, Lock } from 'lucide-react';
import { Badge } from '@kecha/shared-ui';
import { MainTab } from './NavigationTabs';
import { useAuthStore } from '@kecha/shared-auth';

interface HeaderProps {
  currentTab: MainTab;
  onOpenPatternModal: () => void;
  onOpenJournalModal: () => void;
  onOpenPinModal: () => void;
}

export function Header({ currentTab, onOpenPatternModal, onOpenJournalModal, onOpenPinModal }: HeaderProps) {
  const { isOwner, lockToViewer } = useAuthStore();

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 0',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: '32px',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
            nostoi
          </h1>
          <Badge label="Journey The Ninja Way" variant="neutral" size="sm" />
          {isOwner ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
              <ShieldCheck size={12} /> OWNER
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
              <Eye size={12} /> VIEWER
            </span>
          )}
        </div>
        <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
          Level 1 Structural Pattern Mastery — Collect 100 Charts per Stage
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isOwner ? (
          <button onClick={lockToViewer} title="Switch to Viewer Mode" type="button" style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '14px', padding: '9px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} /> Lock to Viewer
          </button>
        ) : (
          <button onClick={onOpenPinModal} title="Unlock Full Control" type="button" style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> Owner Unlock
          </button>
        )}

        {isOwner && currentTab === 'journey' && (
          <button onClick={onOpenPatternModal} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '9px 18px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}>
            <PlusCircle size={16} /> Record Pattern
          </button>
        )}

        {isOwner && currentTab === 'journal' && (
          <button onClick={onOpenJournalModal} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '9px 18px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}>
            <Zap size={16} /> Log Execution
          </button>
        )}
      </div>
    </header>
  );
}
