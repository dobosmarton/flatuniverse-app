import { NextRouteFunction } from '@/lib/route-validator.server';
import { getSimilarByMetadataId } from '@/lib/article-metadata/similarity.server';

type Params = { params: { id: string } };

const getSimilarArticlesByMetadataId: NextRouteFunction<Params> = async (_, { params }) => {
  const similarArticles = await getSimilarByMetadataId(params.id);

  return Response.json({ data: similarArticles }, { status: 200 });
};

export const GET = getSimilarArticlesByMetadataId;
