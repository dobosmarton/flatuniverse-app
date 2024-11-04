import { ThreadChat } from './chat-thread';
import { Suspense } from 'react';

type Props = {
  params: { slug: string };
};

export default function Chat({ params }: Readonly<Props>) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThreadChat params={params} />
    </Suspense>
  );
}
