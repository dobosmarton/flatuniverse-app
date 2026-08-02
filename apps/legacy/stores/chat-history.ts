import { chat_message, chat_thread } from '@prisma/client';
import { persist } from 'zustand/middleware';
import { ArticleMetadata } from '../lib/article-metadata/schema';

export type ChatThreadWithMessages = chat_thread & {
  chat_message: chat_message[];
  suggested_articles?: { article_metadata: ArticleMetadata }[];
};

export type ChatHistorySlice = {
  chatHistory: ChatThreadWithMessages[];
  setChatHistory: (chatHistory: ChatThreadWithMessages[]) => void;
  addToChatHistory: (thread: ChatThreadWithMessages) => void;
  deleteFromChatHistory: (slug: string | null) => void;
  addMessageToChat: (slug: string, message: chat_message) => void;
  addCompletionToChat: (slug: string, messageId: string, token: string) => void;
  getChatBySlug: (slug: string) => ChatThreadWithMessages | undefined;
  addSuggestedArticleToChat: (slug: string, suggestedArticle: ArticleMetadata) => void;
};

export const createChatHistorySlice = persist<ChatHistorySlice, [], [], Pick<ChatHistorySlice, 'chatHistory'>>(
  (set, get) => ({
    chatHistory: [],
    setChatHistory: (chatHistory: ChatThreadWithMessages[]) => set({ chatHistory }),
    addToChatHistory: (thread: ChatThreadWithMessages) =>
      set((state) => ({ chatHistory: [...state.chatHistory, thread] })),
    deleteFromChatHistory: (slug: string | null) => {
      if (slug) {
        return set((state) => ({ chatHistory: state.chatHistory.filter((thread) => thread.slug !== slug) }));
      }
    },
    addMessageToChat: (slug: string, message: chat_message) =>
      set((state) => {
        return {
          chatHistory: state.chatHistory.map((thread) => {
            if (thread.slug === slug) {
              return thread.chat_message.some((originalMessage) => originalMessage.id === message.id)
                ? {
                    ...thread,
                    chat_message: thread.chat_message.map((originalMessage) =>
                      originalMessage.id === message.id ? message : originalMessage
                    ),
                  }
                : { ...thread, chat_message: [...thread.chat_message, message] };
            }
            return thread;
          }),
        };
      }),
    addCompletionToChat: (slug: string, messageId: string, token: string) =>
      set((state) => {
        return {
          chatHistory: state.chatHistory.map((thread) => {
            if (thread.slug === slug) {
              return {
                ...thread,
                chat_message: thread.chat_message.map((message) =>
                  message.id === messageId
                    ? { ...message, content: message.content ? message.content + token : token }
                    : message
                ),
              };
            }
            return thread;
          }),
        };
      }),
    getChatBySlug: (slug: string) => get().chatHistory.find((thread) => thread.slug === slug),
    addSuggestedArticleToChat: (slug: string, suggestedArticle: ArticleMetadata) =>
      set((state) => ({
        chatHistory: state.chatHistory.map((thread) => {
          if (thread.slug === slug) {
            return {
              ...thread,
              suggested_articles: !(thread.suggested_articles ?? []).some(
                (article) => article.article_metadata.slug === suggestedArticle.slug
              )
                ? [...(thread.suggested_articles ?? []), { article_metadata: suggestedArticle }]
                : thread.suggested_articles,
            };
          }
          return thread;
        }),
      })),
  }),
  {
    name: 'chat-history-v1',
    partialize: (state) => ({ chatHistory: state.chatHistory }),
  }
);
