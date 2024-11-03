'use client';

import { useEffect } from 'react';

import { Label } from '@/components/ui/label';
import { MessageBubble } from '@/components/ui/message';
import { article_metadata, chat_message } from '@prisma/client';
import { useCompletion } from '@/hooks/use-completion';
import { CardSmall } from '@/components/article-metadata/card-small';

type Props = {
  slug: string;
  messages: chat_message[];
  initialSuggestions?: article_metadata[];
};

export const ChatCompletion: React.FC<Props> = ({ slug, messages, initialSuggestions }) => {
  const [trigger, { completion, documents, isLoading }] = useCompletion(
    `/api/chat/${slug}/completion`,
    initialSuggestions?.map((article) => ({
      id: article.id,
      external_id: article.external_id,
      title: article.title,
      abstract: article.abstract,
      published: article.published.toDateString(),
      slug: article.slug,
    }))
  );

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'USER') {
      trigger({ prompt: messages[0].content });
    }
  }, []);

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble variant={message.role === 'ASSISTANT' ? 'answer' : 'question'} key={message.id}>
              {message.content}
            </MessageBubble>
          ))}

          {isLoading || completion ? (
            <MessageBubble variant={'answer'}>{isLoading && !completion ? '...' : completion ?? ''}</MessageBubble>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 max-w-[360px]">
        <Label>Suggested Articles</Label>
        {documents.map((article) => (
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
