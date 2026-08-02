import { create } from 'zustand';
import { AIModeSlice, createAIModeSlice } from './ai-mode';
import { NewsletterSlice, createNewsletterSlice } from './newsletter';
import { ViewSettingsSlice, createViewSettingsSlice } from './view-settings';
import { ContextChatSlice, createContextChatSlice } from './context-chat';
import { ChatHistorySlice, createChatHistorySlice } from './chat-history';

export type Store = AIModeSlice & NewsletterSlice & ViewSettingsSlice & ContextChatSlice & ChatHistorySlice;

export const useBoundStore = create<Store>()((...a) => ({
  ...createAIModeSlice(...a),
  ...createNewsletterSlice(...a),
  ...createViewSettingsSlice(...a),
  ...createContextChatSlice(...a),
  ...createChatHistorySlice(...a),
}));
