import { create } from 'zustand';
import type { LabelMode, Layers } from '../fretboard/Fretboard';
import type { BackingStyle } from '../sequence/types';
import { getSetting, saveSetting } from '../storage';

export type ThemePref = 'system' | 'light' | 'dark';

export interface JamSelection {
  key: string;
  progressionId: string;
  style: Exclude<BackingStyle, 'none'>;
  scale: string;
  rootString: 6 | 5;
}

interface Settings {
  layers: Layers;
  labelMode: LabelMode;
  tabCollapsed: boolean;
  jam: JamSelection;
  theme: ThemePref;
}

interface SettingsState extends Settings {
  loaded: boolean;
  init(): Promise<void>;
  toggleLayer(key: keyof Layers): void;
  setLabelMode(mode: LabelMode): void;
  toggleTab(): void;
  setJam(jam: Partial<JamSelection>): void;
  setTheme(theme: ThemePref): void;
}

const DEFAULTS: Settings = {
  layers: { scale: true, landing: true, labels: true, trail: true, next: true },
  labelMode: 'interval',
  tabCollapsed: false,
  jam: { key: 'A', progressionId: 'blues12', style: 'blues-shuffle', scale: 'blues', rootString: 6 },
  theme: 'system',
};

export const LAYER_KEYS: (keyof Layers)[] = ['scale', 'landing', 'labels', 'trail', 'next'];

export const useSettings = create<SettingsState>((set, get) => {
  const persist = () => {
    const { layers, labelMode, tabCollapsed, jam, theme } = get();
    void saveSetting<Settings>('ui', { layers, labelMode, tabCollapsed, jam, theme });
  };
  return {
    ...DEFAULTS,
    loaded: false,
    async init() {
      const saved = await getSetting<Settings>('ui').catch(() => undefined);
      set({ ...DEFAULTS, ...saved, layers: { ...DEFAULTS.layers, ...saved?.layers }, jam: { ...DEFAULTS.jam, ...saved?.jam }, loaded: true });
    },
    toggleLayer(key) {
      set({ layers: { ...get().layers, [key]: !get().layers[key] } });
      persist();
    },
    setLabelMode(labelMode) {
      set({ labelMode });
      persist();
    },
    setTheme(theme) {
      set({ theme });
      persist();
    },
    setJam(jam) {
      set({ jam: { ...get().jam, ...jam } });
      persist();
    },
    toggleTab() {
      set({ tabCollapsed: !get().tabCollapsed });
      persist();
    },
  };
});
