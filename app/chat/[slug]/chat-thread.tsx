import { redirect } from 'next/navigation';
import { CardSmall } from '@/components/article-metadata/card-small';
import { Label } from '@/components/ui/label';
import { MessageBubble } from '@/components/ui/message';
import { chatCompletion, chatResponseToMessage } from '@/lib/chat/chat.server';
import * as threadService from '@/lib/chat/thread.server';

type Props = {
  params: { slug: string };
};

const generateFirstCompletion = async (
  slug: string,
  thread: Awaited<ReturnType<typeof threadService.getMessagesByThreadSlug>>
) => {
  const lastMessage = thread.chat_message[thread.chat_message.length - 1];

  const completion = await chatCompletion(slug, lastMessage.content, false);

  const message = await chatResponseToMessage(completion);

  return threadService.createMessageWithSuggestions(slug, message);
};

const getMessagesOrRedirect = async (slug: string) => {
  try {
    const messages = await threadService.getMessagesByThreadSlug(slug);
    return messages;
  } catch (error) {
    redirect('/');
  }
};

export const ThreadChat: React.FC<Props> = async ({ params }) => {
  let thread = await getMessagesOrRedirect(params.slug);

  if (thread.chat_message.length === 1 && thread.chat_message[0].role === 'USER') {
    thread = await generateFirstCompletion(params.slug, thread);
  }

  return (
    <div className="flex flex-row gap-4 justify-between">
      <div className="flex flex-col gap-4 p-4">
        {thread.chat_message.map((message) => (
          <MessageBubble variant={message.role === 'ASSISTANT' ? 'answer' : 'question'} key={message.id}>
            {message.content}
          </MessageBubble>
        ))}
      </div>
      <div className="flex flex-col gap-4 p-4 max-w-[360px]">
        <Label>Suggested Articles</Label>
        {thread.suggested_articles.map((article) => (
          <CardSmall
            key={article.article_metadata.id}
            id={article.article_metadata.id}
            slug={article.article_metadata.slug}
            title={article.article_metadata.title}
            abstract={article.article_metadata.abstract}
            published={article.article_metadata.published.toDateString()}
          />
        ))}
      </div>
    </div>
  );
};
