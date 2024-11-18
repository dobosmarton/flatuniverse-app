'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWRMutation from 'swr/mutation';

import { chat_message, chat_thread } from '@prisma/client';
import { useBoundStore } from '@/stores';
import { CreateNewThread, CreateNewThreadHeaders, CreateNewThreadData } from '@/app/api/chat/create-thread/schema';

import { post } from '../api-client/post';
import { del } from '../api-client/delete';

type UseChatHook = () => {
  createThread: (params: CreateNewThread) => Promise<chat_thread & { chat_message: chat_message[] }>;
  isCreatingThread: boolean;
  createThreadErrorMessage: string | null;
  resetCreateThreadError: () => void;
  addMessageToThread: (slug: string, message: chat_message) => void;
  onChatSubmit: (prompt: string, turnstileToken: string | null) => Promise<void>;
  chatHistory: chat_thread[];
  deleteThread: (props: { slug: string | null }) => Promise<void>;
  isDeleting: boolean;
};

export const useChat: UseChatHook = () => {
  const { push } = useRouter();

  const { chatHistory, addToChatHistory, deleteFromChatHistory, addMessageToChat } = useBoundStore();

  const chatHistoryAsc = useMemo(() => chatHistory.slice().reverse(), [chatHistory]);

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

  const {
    trigger: createThread,
    isMutating: isCreatingThread,
    error: createThreadError,
    reset: resetCreateThreadError,
  } = useSWRMutation(
    '/api/chat/create-thread',
    async (url: string, params: { arg: CreateNewThread }) =>
      post<CreateNewThreadHeaders, CreateNewThreadData, chat_thread & { chat_message: chat_message[] }>(url, params),
    {
      onSuccess: (data) => {
        // mutateChatHistory();
        addToChatHistory(data);
      },
    }
  );

  const createThreadErrorMessage = createThreadError?.cause?.error ?? createThreadError?.message;

  const addMessageToThread = (slug: string, message: chat_message) => {
    addMessageToChat(slug, message);
  };

  const onChatSubmit = async (prompt: string, turnstileToken: string | null) => {
    const thread = await createThread({ data: { prompt }, headers: { 'X-Captcha-Token': turnstileToken } });
    push(`/chat/${thread.slug}`);
  };

  return {
    createThread,
    isCreatingThread,
    createThreadErrorMessage,
    resetCreateThreadError,
    addMessageToThread,
    onChatSubmit,
    chatHistory: chatHistoryAsc,
    deleteThread,
    isDeleting,
  };
};
