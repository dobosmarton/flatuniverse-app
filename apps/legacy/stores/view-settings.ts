import { StateCreator } from 'zustand';
import { Store } from './index';

export type ViewSettingsSlice = {
  isCompactMode: boolean;
  setCompactMode: (isCompactMode: boolean) => void;
  toggleCompactMode: () => void;
};

export const createViewSettingsSlice: StateCreator<Store, [], [], ViewSettingsSlice> = (set) => ({
  isCompactMode: false,
  setCompactMode: (isCompactMode: boolean) => set({ isCompactMode }),
  toggleCompactMode: () => set((state) => ({ isCompactMode: !state.isCompactMode })),
});
