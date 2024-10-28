import { create } from 'zustand';
import { AIModeSlice, createAIModeSlice } from './ai-mode';
import { NewsletterSlice, createNewsletterSlice } from './newsletter';
import { ViewSettingsSlice, createViewSettingsSlice } from './view-settings';
import { ContextChatSlice, createContextChatSlice } from './context-chat';

export type Store = AIModeSlice & NewsletterSlice & ViewSettingsSlice & ContextChatSlice;

export const useBoundStore = create<Store>()((...a) => ({
  ...createAIModeSlice(...a),
  ...createNewsletterSlice(...a),
  ...createViewSettingsSlice(...a),
  ...createContextChatSlice(...a),
}));
