import { StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Store } from './index';

export type NewsletterSlice = {
  isBannerVisible: boolean;
  setBannerVisible: (isBannerVisible: boolean) => void;
};

export const createNewsletterSlice: StateCreator<Store, [], [], NewsletterSlice> = (set) => ({
  isBannerVisible: true,
  setBannerVisible: (isBannerVisible: boolean) => set({ isBannerVisible }),
});
