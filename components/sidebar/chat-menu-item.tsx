'use client';

import { MessageCircle, Plus } from 'lucide-react';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '../ui/sidebar';
import { useBoundStore } from '@/stores';

type Props = {
  chatHistory: { slug: string }[];
};

export const ChatMenuItem = ({ chatHistory }: Props) => {
  const { toggleContextChat } = useBoundStore();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={toggleContextChat}>
        <MessageCircle />
        <span>Chat</span>
      </SidebarMenuButton>
      <SidebarMenuAction onClick={toggleContextChat}>
        <Plus /> <span className="sr-only">Add Project</span>
      </SidebarMenuAction>
      <SidebarMenuSub>
        {chatHistory.map((thread) => (
          <SidebarMenuSubItem key={thread.slug}>
            <SidebarMenuSubButton asChild>
              <a href={`/chat/${thread.slug}`}>{thread.slug}</a>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
};
