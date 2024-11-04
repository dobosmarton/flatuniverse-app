'use client';

import { useEffect } from 'react';

import { Label } from '@/components/ui/label';
import { MessageBubble } from '@/components/ui/message';
import { chat_message } from '@prisma/client';
import { useCompletion } from '@/hooks/use-completion';
import { CardSmall } from '@/components/article-metadata/card-small';
import { ChatThreadWithMessages } from '@/stores/chat-history';

type Props = {
  slug: string;
  thread: ChatThreadWithMessages;
};

export const ChatCompletion: React.FC<Props> = ({ slug, thread }) => {
  const [trigger, { isLoading }] = useCompletion(slug);

  useEffect(() => {
    if (thread.chat_message.length === 1 && thread.chat_message[0].role === 'USER') {
      trigger({ prompt: thread.chat_message[0].content });
    }
  }, []);

  const getMessageContent = (message: chat_message, isLast: boolean, isLoading: boolean) => {
    if (message.role === 'ASSISTANT') {
      return isLoading && isLast && !message.content ? '...' : message.content;
    }
    return message.content;
  };

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4">
          {thread.chat_message.map((message, index) => (
            <MessageBubble variant={message.role === 'ASSISTANT' ? 'answer' : 'question'} key={message.id}>
              {getMessageContent(message, index === thread.chat_message.length - 1, isLoading)}
            </MessageBubble>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 max-w-[360px]">
        <Label>Suggested Articles</Label>
        {thread.suggested_articles?.map(({ article_metadata: article }) => (
          <CardSmall
            key={article.id}
            id={article.id}
            slug={article.slug}
            title={article.title}
            abstract={article.abstract}
            published={new Date(article.published).toDateString()}
          />
        ))}
      </div>
    </>
  );
};
