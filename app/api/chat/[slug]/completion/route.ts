import { LlamaIndexAdapter, StreamData } from 'ai';
import { NextRouteFunction } from '@/lib/route-validator.server';
import { chatCompletionSchema } from './schema';
import * as threadService from '@/lib/chat/thread.server';
import * as chatService from '@/lib/chat/chat.server';
import * as queryService from '@/lib/chat/query.server';
import { chat_message_role } from '@prisma/client';

// 60 seconds
export const maxDuration = 60;

type Params = { params: { slug: string } };

const chatCompletion: NextRouteFunction<Params> = async (req, { params }) => {
  const reqJson = await req.json();

  const parsedParams = chatCompletionSchema.parse(reqJson);

  const temporalAnalysis = await queryService.analyzeTemporalQuery(parsedParams.prompt);

  const thread = await threadService.getMessagesByThreadSlug(params.slug);

  const suggestions = await chatService.getDocumentSuggestions(
    thread.chat_message,
    parsedParams.prompt,
    temporalAnalysis
  );

  const stream = await chatService.chatCompletion(thread.chat_message, parsedParams.prompt, true, suggestions);

  const data = new StreamData();

  suggestions.forEach((document) => {
    data.appendMessageAnnotation(JSON.stringify({ type: 'article_metadata', article_metadata: document }));
  });

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
