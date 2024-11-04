'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChatCompletion } from './chat-completion';
import { useBoundStore } from '@/stores';

type Props = {
  params: { slug: string };
};

export const ThreadChatComp: React.FC<Props> = ({ params }) => {
  const router = useRouter();
  const { getChatBySlug } = useBoundStore();

  const thread = getChatBySlug(params.slug);

  if (!thread) {
    router.replace('/');
    return null;
  }

  return (
    <div className="flex flex-row gap-4 justify-between">
      <ChatCompletion slug={params.slug} thread={thread} />
    </div>
  );
};

export const ThreadChat = dynamic(() => Promise.resolve(ThreadChatComp), {
  ssr: false,
});
