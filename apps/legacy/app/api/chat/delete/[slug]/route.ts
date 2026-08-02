import { NextRouteFunction } from '@/lib/route-validator.server';
import * as threadService from '@/lib/chat/thread.server';

type Params = { params: { slug: string } };

const deleteThread: NextRouteFunction<Params> = async (_, { params }) => {
  try {
    await threadService.deleteThread(params.slug);
  } catch (error) {
    return Response.json({ status: 500, error });
  }

  return Response.json({ status: 200 });
};

export const DELETE = deleteThread;
