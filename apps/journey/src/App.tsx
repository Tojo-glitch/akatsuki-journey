import { useState, useEffect } from 'react';
import { useJourneyStore } from './store/useJourneyStore';
import { useJournalStore } from './store/useJournalStore';
import { useAuthStore } from '@kecha/shared-auth';
import { Header } from './components/Header';
import { NavigationTabs, MainTab } from './components/NavigationTabs';
import { DashboardView } from './components/dashboard/DashboardView';
import { LevelOverviewCard } from './components/LevelOverviewCard';
import { CategoryProgressGrid } from './components/CategoryProgressGrid';
import { OwnerPinModal } from './components/OwnerPinModal';
import { ExpressIngestModal } from './components/ExpressIngestModal';
import { ChartGallery } from './components/ChartGallery';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { LevelPlaceholder } from './components/LevelPlaceholder';
import { JournalView } from './components/JournalView';
import { SettingsView } from './components/SettingsView';
import { RecordTradePage } from './pages/RecordTradePage';
import { RecordPatternPage } from './pages/RecordPatternPage';
import { EditTradePage } from './pages/EditTradePage';
import { EditPatternPage } from './pages/EditPatternPage';
import { BatchUploadPage } from './pages/BatchUploadPage';
import { ChartEntry, TradeJournalEntry, JourneyLevel } from '@kecha/shared-types';

export function App() {
  const [currentTab, setCurrentTab] = useState<MainTab>('dashboard');
  const [currentLevel, setCurrentLevel] = useState<JourneyLevel>(1);
  const [activePage, setActivePage] = useState<'main' | 'record-trade' | 'record-pattern' | 'edit-trade' | 'edit-pattern' | 'batch-pattern'>('main');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isExpressIngestOpen, setIsExpressIngestOpen] = useState(false);
  const [activeLightboxEntry, setActiveLightboxEntry] = useState<ChartEntry | null>(null);
  const [editingPatternEntry, setEditingPatternEntry] = useState<ChartEntry | null>(null);
  const [editingTradeEntry, setEditingTradeEntry] = useState<TradeJournalEntry | null>(null);

  const { isOwner } = useAuthStore();
  const { entries, activeCategoryFilter, updateEntry, deleteEntry, setCategoryFilter, getStats, initStorage } = useJourneyStore();
  const { addTrade, updateTrade } = useJournalStore();

  useEffect(() => {
    initStorage();
  }, [initStorage]);

  const stats = getStats();
  const filteredEntries = activeCategoryFilter === 'all'
    ? entries
    : entries.filter((e) => e.category === activeCategoryFilter);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '0 16px 80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Header
          currentTab={currentTab}
          onOpenPatternModal={() => setActivePage('record-pattern')}
          onOpenJournalModal={() => setActivePage('record-trade')}
          onOpenPinModal={() => setIsPinModalOpen(true)}
        />

        {activePage === 'record-trade' && (
          <RecordTradePage onBack={() => setActivePage('main')} onSave={addTrade} />
        )}

        {activePage === 'record-pattern' && (
          <RecordPatternPage onBack={() => setActivePage('main')} onOpenBatch={() => setActivePage('batch-pattern')} />
        )}

        {activePage === 'batch-pattern' && (
          <BatchUploadPage onBack={() => setActivePage('main')} />
        )}

        {activePage === 'edit-trade' && editingTradeEntry && (
          <EditTradePage trade={editingTradeEntry} onBack={() => { setEditingTradeEntry(null); setActivePage('main'); }} onSave={updateTrade} />
        )}

        {activePage === 'edit-pattern' && editingPatternEntry && (
          <EditPatternPage entry={editingPatternEntry} onBack={() => { setEditingPatternEntry(null); setActivePage('main'); }} onSave={updateEntry} />
        )}

        {activePage === 'main' && (
          <>
            <div className="touch-scroll-x" style={{ paddingBottom: '4px' }}>
              <NavigationTabs currentTab={currentTab} onSelectTab={setCurrentTab} currentLevel={currentLevel} onSelectLevel={setCurrentLevel} />
            </div>

            {currentTab === 'dashboard' && <DashboardView />}

            {currentTab === 'journey' && (
              currentLevel === 1 ? (
                <>
                  <LevelOverviewCard stats={stats} onOpenExpressIngest={() => setIsExpressIngestOpen(true)} />
                  <CategoryProgressGrid stats={stats} selectedCategory={activeCategoryFilter} onSelectCategory={setCategoryFilter} />
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Level 1 Pattern Records ({filteredEntries.length})</h3>
                  </div>
                  <ChartGallery entries={filteredEntries} isOwner={isOwner} onView={(entry) => setActiveLightboxEntry(entry)} onEdit={(entry) => { setEditingPatternEntry(entry); setActivePage('edit-pattern'); }} onDelete={deleteEntry} onOpenAddModal={() => setActivePage('record-pattern')} />
                </>
              ) : (
                <LevelPlaceholder level={currentLevel} />
              )
            )}

            {currentTab === 'journal' && (
              <JournalView onOpenLogModal={() => setActivePage('record-trade')} onEditTrade={(trade) => { setEditingTradeEntry(trade); setActivePage('edit-trade'); }} />
            )}
            {currentTab === 'settings' && <SettingsView />}
          </>
        )}

        <ExpressIngestModal isOpen={isExpressIngestOpen} onClose={() => setIsExpressIngestOpen(false)} defaultCategory={activeCategoryFilter === 'all' ? 'internal_up_to_down' : activeCategoryFilter} />
        <OwnerPinModal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} />
        <ImageLightboxModal entry={activeLightboxEntry} onClose={() => setActiveLightboxEntry(null)} />
      </div>
    </div>
  );
}
