import { create } from 'zustand';
import { AIModeSlice, createAIModeSlice } from './ai-mode';
import { NewsletterSlice, createNewsletterSlice } from './newsletter';
import { ViewSettingsSlice, createViewSettingsSlice } from './view-settings';
import { persist } from 'zustand/middleware';

export type Store = AIModeSlice & NewsletterSlice & ViewSettingsSlice;

export const useBoundStore = create<Store>()(
  persist(
    (...a) => ({
      ...createAIModeSlice(...a),
      ...createNewsletterSlice(...a),
      ...createViewSettingsSlice(...a),
    }),
    {
      name: 'research-news-storage',
      partialize: (state) => ({
        similarArticlesEnabled: state.similarArticlesEnabled,
        summaryEnabled: state.summaryEnabled,
        isBannerVisible: state.isBannerVisible,
      }),
    }
  )
);
