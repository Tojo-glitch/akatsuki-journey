import { create } from 'zustand';
import { SystemSettings, ConfigItem } from '@kecha/shared-types';
import { storageHelper } from '@kecha/shared-utils';

const SETTINGS_KEY = 'nostoi_system_settings_v1';

const toConfigItems = (names: string[]): ConfigItem[] =>
  names.map((name) => ({ id: name, name, enabled: true }));

const DEFAULT_SETTINGS: SystemSettings = {
  pairs: toConfigItems(['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'BTCUSD', 'US30']),
  timeframes: toConfigItems(['M1', 'M5', 'M15', 'H1', 'H4', 'D1']),
  sessions: toConfigItems(['Asia', 'London', 'New York']),
  setups: toConfigItems(['Wyckoff', 'Reapper']),
  sessionTimes: [
    { name: 'Asia', startHour: 5, endHour: 13 },
    { name: 'London', startHour: 14, endHour: 22 },
    { name: 'New York', startHour: 19, endHour: 3 }
  ]
};

const normalizeStored = (stored: unknown): SystemSettings => {
  if (!stored || typeof stored !== 'object') return DEFAULT_SETTINGS;
  const s = stored as Record<string, unknown>;
  const normList = (val: unknown, def: ConfigItem[]) => {
    if (!Array.isArray(val)) return def;
    return val.map((item) => typeof item === 'string' ? { id: item, name: item, enabled: true } : item);
  };
  return {
    pairs: normList(s.pairs, DEFAULT_SETTINGS.pairs),
    timeframes: normList(s.timeframes, DEFAULT_SETTINGS.timeframes),
    sessions: normList(s.sessions, DEFAULT_SETTINGS.sessions),
    setups: normList(s.setups, DEFAULT_SETTINGS.setups),
    sessionTimes: Array.isArray(s.sessionTimes) ? (s.sessionTimes as SystemSettings['sessionTimes']) : DEFAULT_SETTINGS.sessionTimes
  };
};

type SettingKey = 'pairs' | 'timeframes' | 'sessions' | 'setups';

interface SettingsStoreState {
  settings: SystemSettings;
  addOption: (type: SettingKey, value: string) => void;
  toggleOption: (type: SettingKey, id: string) => void;
  removeOption: (type: SettingKey, id: string) => void;
  updateSessionTime: (name: string, startHour: number, endHour: number) => void;
  resetDefaults: () => void;
  getActiveOptions: (type: SettingKey) => string[];
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: normalizeStored(storageHelper.get(SETTINGS_KEY, DEFAULT_SETTINGS)),

  addOption: (type, value) => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    const current = get().settings[type];
    if (current.some((c) => c.name.toUpperCase() === trimmed)) return;
    const newItem: ConfigItem = { id: trimmed, name: trimmed, enabled: true };
    const updated = { ...get().settings, [type]: [...current, newItem] };
    storageHelper.set(SETTINGS_KEY, updated);
    set({ settings: updated });
  },

  toggleOption: (type, id) => {
    const updated = {
      ...get().settings,
      [type]: get().settings[type].map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item)
    };
    storageHelper.set(SETTINGS_KEY, updated);
    set({ settings: updated });
  },

  removeOption: (type, id) => {
    const updated = {
      ...get().settings,
      [type]: get().settings[type].filter((item) => item.id !== id)
    };
    storageHelper.set(SETTINGS_KEY, updated);
    set({ settings: updated });
  },

  updateSessionTime: (name, startHour, endHour) => {
    const updatedTimes = get().settings.sessionTimes.map((s) => s.name === name ? { ...s, startHour, endHour } : s);
    const updated = { ...get().settings, sessionTimes: updatedTimes };
    storageHelper.set(SETTINGS_KEY, updated);
    set({ settings: updated });
  },

  resetDefaults: () => {
    storageHelper.set(SETTINGS_KEY, DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },

  getActiveOptions: (type) => {
    return get().settings[type].filter((item) => item.enabled).map((item) => item.name);
  }
}));
