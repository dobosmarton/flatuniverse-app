import { StateCreator } from 'zustand';
import { Store } from './index';

export type ContextChatSlice = {
  isContextChatOpen: boolean;
  setIsContextChatOpen: (isContextChatOpen: boolean) => void;
  toggleContextChat: () => void;
};

export const createContextChatSlice: StateCreator<Store, [], [], ContextChatSlice> = (set) => ({
  isContextChatOpen: false,
  setIsContextChatOpen: (isContextChatOpen: boolean) => set({ isContextChatOpen }),
  toggleContextChat: () => set((state) => ({ isContextChatOpen: !state.isContextChatOpen })),
});
