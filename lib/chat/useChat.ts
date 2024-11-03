'use client';

import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';

import { chat_thread } from '@prisma/client';
import { useBoundStore } from '@/stores';
import { CreateNewThread } from '@/app/api/chat/create-thread/schema';

import { post } from '../api-client/post';
import { fetcher } from '../api-client/fetch';

type Props = {
  initialChatHistory?: chat_thread[];
};

export const useChat = ({ initialChatHistory }: Props) => {
  const { push } = useRouter();
  const { mutate } = useSWRConfig();
  const { isContextChatOpen, setIsContextChatOpen, toggleContextChat } = useBoundStore();

  const { data: chatHistory, mutate: mutateChatHistory } = useSWR(`/api/chat?limit=10`, fetcher<chat_thread[]>, {
    keepPreviousData: true,
    fallbackData: initialChatHistory,
  });

  const { trigger, isMutating } = useSWRMutation(
    '/api/chat/create-thread',
    async (url: string, params: { arg: CreateNewThread }) =>
      post<string, CreateNewThread, { slug: string }>(url, params),
    {
      onSuccess: () => {
        mutate('/api/chat?limit=10');
      },
    }
  );

  const onChatSubmit = async (prompt: string) => {
    const thread = await trigger({ prompt });
    push(`/chat/${thread.slug}`);
    setIsContextChatOpen(false);
  };

  return {
    isContextChatOpen,
    toggleContextChat,
    createThread: trigger,
    isCreatingThread: isMutating,
    onChatSubmit,
    chatHistory,
    mutateChatHistory,
  };
};
