'use client';

import useSWRMutation from 'swr/mutation';

import { useBoundStore } from '@/stores';

import { post } from '../api-client/post';
import { CreateNewThread } from '@/app/api/chat/create-thread/schema';
import { useRouter } from 'next/navigation';

export const useChat = () => {
  const { push } = useRouter();
  const { isContextChatOpen, setIsContextChatOpen, toggleContextChat } = useBoundStore();

  const { trigger, isMutating } = useSWRMutation(
    '/api/chat/create-thread',
    async (url: string, params: { arg: CreateNewThread }) =>
      post<string, CreateNewThread, { slug: string }>(url, params)
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
  };
};
