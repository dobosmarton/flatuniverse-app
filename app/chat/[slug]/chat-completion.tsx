'use client';

import { useEffect } from 'react';

import { MessageBubble } from '@/components/ui/message';
import { chat_message } from '@prisma/client';
import { useCompletion } from '@/hooks/use-completion';
import { CardSmall } from '@/components/article-metadata/card-small';

type Props = {
  slug: string;
  messages: chat_message[];
};

export const ChatCompletion: React.FC<Props> = ({ slug, messages }) => {
  const [trigger, { completion, documents, isLoading }] = useCompletion(`/api/chat/${slug}/completion`);

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'USER') {
      trigger({ prompt: messages[0].content });
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <MessageBubble variant={message.role === 'ASSISTANT' ? 'answer' : 'question'} key={message.id}>
          {message.content}
        </MessageBubble>
      ))}

      <MessageBubble variant={'answer'}>{isLoading && !completion ? '...' : completion ?? ''}</MessageBubble>

      {documents.length > 0 && (
        <div className="flex flex-row gap-2">
          {documents.map((document) => (
            <CardSmall
              key={document.id}
              id={document.id}
              slug={document.slug}
              title={document.title}
              abstract={document.abstract}
              published={new Date(document.published).toDateString()}
            />
          ))}
        </div>
      )}
    </div>
  );
};
