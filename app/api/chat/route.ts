import { NextRouteFunction } from '@/lib/route-validator.server';
import * as chatService from '@/lib/chat/chat.server';

const getThreads: NextRouteFunction<{}> = async (req) => {
  const searchParams = req.nextUrl.searchParams;
  const limit = searchParams.get('limit');

  try {
    const threads = await chatService.getChatHistory({ limit: limit ? parseInt(limit) : undefined });

    return Response.json({ status: 200, data: threads });
  } catch (error) {
    return Response.json({ status: 500, error });
  }
};

export const GET = getThreads;
