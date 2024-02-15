import { NextRouteFunction } from '@/lib/route-validator.server';
import { articleLoader } from '@/lib/article-metadata/loader.server';

type Params = { params: { id: string } };

const getRemoteArticles: NextRouteFunction<Params, { data: boolean }> = async (_, { params }) => {
  await articleLoader();

  return Response.json({}, { status: 200 });
};

export const GET = getRemoteArticles;
