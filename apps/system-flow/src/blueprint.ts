import { SystemFlowNode } from '@kecha/shared-types';

export const SYSTEM_BLUEPRINT_NODES: SystemFlowNode[] = [
  {
    id: 'node-journey-level1',
    sourceApp: 'apps/journey:3000',
    subRoute: 'PAGE: /level1 (Journey The Ninja Way)',
    storageKey: 'nostoi_journey_level1_v1',
    label: 'Collect 100 charts x 4 categories (400 Total)',
    status: 'active'
  },
  {
    id: 'node-journal-live',
    sourceApp: 'apps/journey:3000',
    subRoute: 'PAGE: /journal (Fast Live Trading Journal)',
    storageKey: 'nostoi_journal_entries_v1',
    label: 'Wyckoff & Reapper Trade History + Review Comments',
    status: 'active'
  },
  {
    id: 'node-journal-comments',
    sourceApp: 'apps/journey:3000',
    subRoute: 'PAGE: /journal/comments',
    storageKey: 'nostoi_journal_comments_v1',
    label: 'Public Feedback & Mentorship Comments',
    status: 'active'
  },
  {
    id: 'node-settings-config',
    sourceApp: 'apps/journey:3000',
    subRoute: 'PAGE: /settings (Dynamic Pairs/TF/Sessions)',
    storageKey: 'nostoi_system_settings_v1',
    label: 'Dynamic Config for Pairs, Timeframes, Sessions, Setups',
    status: 'active'
  }
];
