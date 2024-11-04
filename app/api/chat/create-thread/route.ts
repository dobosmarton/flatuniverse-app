import { NextRouteFunction } from '@/lib/route-validator.server';
import * as threadService from '@/lib/chat/thread.server';
import { createNewThreadSchema } from './schema';

type Params = { params: { prompt: string } };

const createNewThread: NextRouteFunction<{}, Params> = async (req) => {
  const reqJson = await req.json();

  const parsedParams = createNewThreadSchema.parse(reqJson);

  const thread = await threadService.create(parsedParams.prompt);

  return Response.json({ data: thread }, { status: 200 });
};

export const POST = createNewThread;
