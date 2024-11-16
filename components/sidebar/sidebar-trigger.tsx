'use client';

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export const SidebarTitle = () => {
  const { open } = useSidebar();

  return (
    <div className="flex justify-between items-center pb-0 p-4">
      <span className={cn('', open ? 'block' : 'hidden')}>Flat universe</span>
      <SidebarTrigger className="w-4 h-4" />
    </div>
  );
};
