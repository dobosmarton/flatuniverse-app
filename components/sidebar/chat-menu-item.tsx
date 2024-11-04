'use client';

import { useState } from 'react';
import { MessageCircle, Plus } from 'lucide-react';

import { useBoundStore } from '@/stores';
import { useChat } from '@/lib/chat/useChat';

import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '../ui/sidebar';
import { ChatHistoryItem } from './chat-history-item';
import { ConfirmDialog } from '../confirm-dialog';

export const ChatMenuItem: React.FC = () => {
  const [selectedChatForDeletion, setSelectedChatForDeletion] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toggleContextChat } = useBoundStore();

  const { chatHistory, isDeleting, deleteThread } = useChat();

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
              isDeleting={isDeleting && selectedChatForDeletion === thread.slug}
              onDelete={handleOnDelete}
            />
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
      <ConfirmDialog
        title="Delete Chat"
        description="Are you sure you want to delete this chat?"
        onConfirm={() => deleteThread({ slug: selectedChatForDeletion })}
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
      />
    </>
  );
};
