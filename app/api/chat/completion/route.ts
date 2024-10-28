import { NextRouteFunction } from '@/lib/route-validator.server';
import * as logger from '@/lib/logger';
import { chatCompletionSchema } from './schema';
import * as messageService from '@/lib/chat/chat.server';

type Params = { params: { threadSlug: string; prompt: string } };

const chatCompletion: NextRouteFunction<Params> = async (req) => {
  const reqJson = await req.json();

  const parsedParams = chatCompletionSchema.parse(reqJson);

  const response = await messageService.chatCompletion(parsedParams.threadSlug, parsedParams.prompt);

  return Response.json({ data: response }, { status: 200 });
};

export const POST = chatCompletion;
