'use client';

import { Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { SidebarMenuAction, SidebarMenuSubButton, SidebarMenuSubItem } from '../ui/sidebar';

type Props = {
  thread: { slug: string };
  isDeleting: boolean;
  onDelete: (slug: string) => void;
};

export const ChatHistoryItem: React.FC<Props> = ({ thread, isDeleting, onDelete }) => {
  return (
    <SidebarMenuSubItem className="relative">
      <SidebarMenuSubButton asChild>
        <Link href={`/chat/${thread.slug}`}>{thread.slug.slice(0, 20)}...</Link>
      </SidebarMenuSubButton>
      <SidebarMenuAction className="right-1" onClick={() => onDelete(thread.slug)}>
        {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
      </SidebarMenuAction>
    </SidebarMenuSubItem>
  );
};
