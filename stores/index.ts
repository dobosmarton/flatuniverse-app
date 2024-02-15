import { create } from 'zustand';
import { AIModeSlice, createAIModeSlice } from './ai-mode';
import { ArticleFilters, createArticleFiltersSlice } from './article-filters';
import { NewsletterSlice, createNewsletterSlice } from './newsletter';
import { persist } from 'zustand/middleware';

export type Store = AIModeSlice & ArticleFilters & NewsletterSlice;

export const useBoundStore = create<Store>()(
  persist(
    (...a) => ({
      ...createAIModeSlice(...a),
      ...createArticleFiltersSlice(...a),
      ...createNewsletterSlice(...a),
    }),
    {
      name: 'research-news-storage',
      partialize: (state) => ({
        aiEnabled: state.aiEnabled,
        isBannerVisible: state.isBannerVisible,
      }),
    }
  )
);
