import { LayoutDashboard, Compass, BookOpen, Settings } from 'lucide-react';
import { JourneyLevel } from '@kecha/shared-types';

export type MainTab = 'dashboard' | 'journey' | 'journal' | 'settings';

interface NavigationTabsProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  currentLevel: JourneyLevel;
  onSelectLevel: (lvl: JourneyLevel) => void;
}

export function NavigationTabs({
  currentTab,
  onSelectTab,
  currentLevel,
  onSelectLevel
}: NavigationTabsProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '16px' }}>
        <button
          onClick={() => onSelectTab('dashboard')}
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: currentTab === 'dashboard' ? '#ffffff' : 'transparent',
            color: currentTab === 'dashboard' ? '#0f172a' : '#64748b',
            border: 'none', borderRadius: '12px', padding: '8px 18px',
            fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: currentTab === 'dashboard' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          <LayoutDashboard size={16} /> Edge Dashboard
        </button>

        <button
          onClick={() => onSelectTab('journey')}
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: currentTab === 'journey' ? '#ffffff' : 'transparent',
            color: currentTab === 'journey' ? '#0f172a' : '#64748b',
            border: 'none', borderRadius: '12px', padding: '8px 18px',
            fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: currentTab === 'journey' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          <Compass size={16} /> Ninja Journey
        </button>

        <button
          onClick={() => onSelectTab('journal')}
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: currentTab === 'journal' ? '#ffffff' : 'transparent',
            color: currentTab === 'journal' ? '#0f172a' : '#64748b',
            border: 'none', borderRadius: '12px', padding: '8px 18px',
            fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: currentTab === 'journal' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          <BookOpen size={16} /> Live Journal
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: currentTab === 'settings' ? '#ffffff' : 'transparent',
            color: currentTab === 'settings' ? '#0f172a' : '#64748b',
            border: 'none', borderRadius: '12px', padding: '8px 18px',
            fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: currentTab === 'settings' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          <Settings size={16} /> Settings
        </button>
      </div>

      {currentTab === 'journey' && (
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '14px' }}>
          {([1, 2, 3] as JourneyLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => onSelectLevel(lvl)}
              type="button"
              style={{
                background: currentLevel === lvl ? '#0f172a' : 'transparent',
                color: currentLevel === lvl ? '#ffffff' : '#64748b',
                border: 'none', borderRadius: '10px', padding: '6px 14px',
                fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Level {lvl}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
