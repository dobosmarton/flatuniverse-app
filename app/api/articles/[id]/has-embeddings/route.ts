import { NextRouteFunction } from '@/lib/route-validator.server';
import { hasEmbeddingsForArticle } from '@/lib/embeddings/embeddings.server';

type Params = { params: { id: string } };

const hasEmbeddings: NextRouteFunction<Params, { data: boolean }> = async (_, { params }) => {
  const hasEmbeddings = await hasEmbeddingsForArticle(params.id);

  return Response.json({ data: hasEmbeddings }, { status: 200 });
};

export const GET = hasEmbeddings;
