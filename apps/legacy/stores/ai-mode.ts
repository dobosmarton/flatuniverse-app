import { StateCreator } from 'zustand';
import { Store } from './index';

export type AIModeSlice = {
  summaryEnabled: boolean;
  setSummaryEnabled: (summaryEnabled: boolean) => void;
};

export const createAIModeSlice: StateCreator<Store, [], [], AIModeSlice> = (set) => ({
  summaryEnabled: false,
  setSummaryEnabled: (summaryEnabled: boolean) => set({ summaryEnabled }),
});
