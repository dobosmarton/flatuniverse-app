import { redirect } from 'next/navigation';
import * as threadService from '@/lib/chat/thread.server';
import { ChatCompletion } from './chat-completion';

type Props = {
  params: { slug: string };
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

  return (
    <div className="flex flex-row gap-4 justify-between">
      <ChatCompletion
        slug={params.slug}
        messages={thread.chat_message}
        initialSuggestions={thread.suggested_articles.map((article) => article.article_metadata)}
      />
    </div>
  );
};
