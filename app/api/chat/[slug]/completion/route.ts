import { LlamaIndexAdapter, StreamData } from 'ai';
import { NextRouteFunction } from '@/lib/route-validator.server';
import * as logger from '@/lib/logger';
import { chatCompletionSchema } from './schema';
import * as threadService from '@/lib/chat/thread.server';
import * as chatService from '@/lib/chat/chat.server';
import { chat_message_role } from '@prisma/client';
import { ExtendedArticleMetadata } from '@/lib/article-metadata/metadata';

type Params = { params: { slug: string } };

const chatCompletion: NextRouteFunction<Params> = async (req, { params }) => {
  const reqJson = await req.json();

  const parsedParams = chatCompletionSchema.parse(reqJson);

  const thread = await threadService.getMessagesByThreadSlug(params.slug);

  const stream = await chatService.chatCompletion(thread.chat_message, parsedParams.prompt);

  // const documents = await chatService.getDocumentSuggestions(thread.chat_message, parsedParams.prompt);

  let suggestions: ExtendedArticleMetadata[] = [];

  // Get document suggestions and append them as message annotations to the stream
  chatService.getDocumentSuggestions(thread.chat_message, parsedParams.prompt).then((documents) => {
    documents.forEach((document) => {
      data.appendMessageAnnotation(JSON.stringify({ type: 'article_metadata', article_metadata: document }));
    });
    suggestions.push(...documents);
  });

  const data = new StreamData();

  return LlamaIndexAdapter.toDataStreamResponse(stream, {
    data,
    callbacks: {
      onCompletion: async (response) => {
        await threadService.createMessageWithSuggestions(
          params.slug,
          response,
          chat_message_role.ASSISTANT,
          suggestions
        );
      },
      onFinal: async () => {
        await data.close();
      },
    },
  });
};

export const POST = chatCompletion;
