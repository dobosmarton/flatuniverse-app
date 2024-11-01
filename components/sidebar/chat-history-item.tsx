'use client';

import { Trash2 } from 'lucide-react';

import { SidebarMenuAction, SidebarMenuSubButton, SidebarMenuSubItem } from '../ui/sidebar';

type Props = {
  thread: { slug: string };
  onDelete: (slug: string) => void;
};

export const ChatHistoryItem: React.FC<Props> = ({ thread, onDelete }) => {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <a href={`/chat/${thread.slug}`}>{thread.slug.slice(0, 20)}...</a>
      </SidebarMenuSubButton>
      <SidebarMenuAction onClick={() => onDelete(thread.slug)}>
        <Trash2 /> <span className="sr-only">Delete Chat</span>
      </SidebarMenuAction>
    </SidebarMenuSubItem>
  );
};
