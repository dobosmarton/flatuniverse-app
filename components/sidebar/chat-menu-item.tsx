'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import useSWRMutation from 'swr/mutation';
import useSWR from 'swr';

import { useBoundStore } from '@/stores';
import { del } from '@/lib/api-client/delete';

import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '../ui/sidebar';
import { ChatHistoryItem } from './chat-history-item';
import { ConfirmDialog } from '../confirm-dialog';

import { fetcher } from '@/lib/api-client/fetch';
import { chat_thread } from '@prisma/client';

export const ChatMenuItem = () => {
  const [selectedChatForDeletion, setSelectedChatForDeletion] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toggleContextChat } = useBoundStore();

  const { data: chatHistory, mutate } = useSWR(`/api/chat?limit=10`, fetcher<chat_thread[]>, {
    keepPreviousData: true,
  });

  const { trigger, isMutating } = useSWRMutation(`/api/chat/delete/${selectedChatForDeletion}`, del, {
    onSuccess: () => {
      setSelectedChatForDeletion(null);
      mutate();
    },
    onError: () => {
      setSelectedChatForDeletion(null);
    },
  });

  const handleOnDelete = (slug: string) => {
    setSelectedChatForDeletion(slug);
    setIsConfirmDialogOpen(true);
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={toggleContextChat}>
          <MessageCircle />
          <span>Chat</span>
        </SidebarMenuButton>
        <SidebarMenuAction onClick={toggleContextChat}>
          <Plus /> <span className="sr-only">Add Chat</span>
        </SidebarMenuAction>
        <SidebarMenuSub className="pr-0 mr-0">
          {chatHistory?.map((thread) => (
            <ChatHistoryItem
              key={thread.slug}
              thread={thread}
              isDeleting={isMutating && selectedChatForDeletion === thread.slug}
              onDelete={handleOnDelete}
            />
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
      <ConfirmDialog
        title="Delete Chat"
        description="Are you sure you want to delete this chat?"
        onConfirm={() => trigger()}
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
      />
    </>
  );
};
