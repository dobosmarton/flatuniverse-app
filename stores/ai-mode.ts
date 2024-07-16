import { StateCreator } from 'zustand';
import { Store } from './index';

export type AIModeSlice = {
  similarArticlesEnabled: boolean;
  summaryEnabled: boolean;
  setSimilarArticlesEnabled: (similarArticlesEnabled: boolean) => void;
  setSummaryEnabled: (summaryEnabled: boolean) => void;
};

export const createAIModeSlice: StateCreator<Store, [], [], AIModeSlice> = (set) => ({
  similarArticlesEnabled: true,
  summaryEnabled: false,
  setSimilarArticlesEnabled: (similarArticlesEnabled: boolean) => set({ similarArticlesEnabled }),
  setSummaryEnabled: (summaryEnabled: boolean) => set({ summaryEnabled }),
});
