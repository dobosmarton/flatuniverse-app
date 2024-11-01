'use client';

import { useState } from 'react';
import { MessageCircle, Plus } from 'lucide-react';

import { useBoundStore } from '@/stores';
import { del } from '@/lib/api-client/delete';

import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '../ui/sidebar';
import { ChatHistoryItem } from './chat-history-item';
import { ConfirmDialog } from '../confirm-dialog';
import useSWRMutation from 'swr/mutation';

type Props = {
  chatHistory: { slug: string }[];
};

export const ChatMenuItem = ({ chatHistory }: Props) => {
  const [selectedChatForDeletion, setSelectedChatForDeletion] = useState<string | null>(null);
  const { toggleContextChat } = useBoundStore();

  const { trigger } = useSWRMutation(`/api/chat/delete/${selectedChatForDeletion}`, del);

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
        <SidebarMenuSub>
          {chatHistory.map((thread) => (
            <ChatHistoryItem key={thread.slug} thread={thread} onDelete={setSelectedChatForDeletion} />
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
      <ConfirmDialog
        title="Delete Chat"
        description="Are you sure you want to delete this chat?"
        onConfirm={() => trigger()}
        open={Boolean(selectedChatForDeletion)}
        onClose={() => setSelectedChatForDeletion(null)}
      />
    </>
  );
};
