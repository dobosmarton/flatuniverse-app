'use client';

import { useRouter } from 'next/navigation';
import { useBoundStore } from '@/stores';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ChatCompletion } from './chat-completion';

type Props = {
  params: { slug: string };
};

export default function Chat({ params }: Readonly<Props>) {
  const router = useRouter();
  const { getChatBySlug } = useBoundStore();

  const thread = getChatBySlug(params.slug);

  if (!thread) {
    router.replace('/');
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row w-full gap-2 md:gap-4 justify-between">
      <div className="flex p-4 pb-0 md:hidden">
        <SidebarTrigger className="w-4 h-4" />
      </div>
      <ChatCompletion slug={params.slug} thread={thread} />
    </div>
  );
}
