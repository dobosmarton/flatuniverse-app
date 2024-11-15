'use client';

import { useRouter } from 'next/navigation';
import { useBoundStore } from '@/stores';
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
    <div className="flex flex-row w-full gap-4 justify-between">
      <ChatCompletion slug={params.slug} thread={thread} />
    </div>
  );
}
