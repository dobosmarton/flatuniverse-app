'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWRMutation from 'swr/mutation';

import { chat_message, chat_thread } from '@prisma/client';
import { useBoundStore } from '@/stores';
import { CreateNewThread } from '@/app/api/chat/create-thread/schema';

import { post } from '../api-client/post';
import { del } from '../api-client/delete';

export const useChat = () => {
  const { push } = useRouter();

  const { chatHistory, addToChatHistory, deleteFromChatHistory, addMessageToChat } = useBoundStore();

  const chatHistoryAsc = useMemo(() => chatHistory.toReversed(), [chatHistory]);

  /* const { data: chatHistory, mutate: mutateChatHistory } = useSWR(`/api/chat?limit=10`, fetcher<chat_thread[]>, {
    keepPreviousData: true,
    fallbackData: initialChatHistory,
  }); */

  const { trigger: deleteThread, isMutating: isDeleting } = useSWRMutation(
    `/api/chat/delete`,
    async (url: string, params: { arg: { slug: string | null } }) => {
      if (!params.arg.slug) {
        return;
      }

      await del(url, params.arg.slug);
      deleteFromChatHistory(params.arg.slug);
    },
    {
      /*  onSuccess: (data, key, config) => {
        mutateChatHistory();
      }, */
    }
  );

  const { trigger: createThread, isMutating: isCreatingThread } = useSWRMutation(
    '/api/chat/create-thread',
    async (url: string, params: { arg: CreateNewThread }) =>
      post<string, CreateNewThread, chat_thread & { chat_message: chat_message[] }>(url, params),
    {
      onSuccess: (data) => {
        // mutateChatHistory();
        addToChatHistory(data);
      },
    }
  );

  const addMessageToThread = (slug: string, message: chat_message) => {
    addMessageToChat(slug, message);
  };

  const onChatSubmit = async (prompt: string) => {
    const thread = await createThread({ prompt });
    push(`/chat/${thread.slug}`);
  };

  return {
    createThread,
    isCreatingThread,
    addMessageToThread,
    onChatSubmit,
    chatHistory: chatHistoryAsc,
    deleteThread,
    isDeleting,
  };
};
