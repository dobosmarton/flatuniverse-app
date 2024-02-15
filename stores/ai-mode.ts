import { StateCreator } from 'zustand';
import { Store } from './index';

export type AIModeSlice = {
  aiEnabled: boolean;
  setAiEnabled: (aiEnabled: boolean) => void;
};

export const createAIModeSlice: StateCreator<Store, [], [], AIModeSlice> = (set) => ({
  aiEnabled: false,
  setAiEnabled: (aiEnabled: boolean) => set({ aiEnabled }),
});
