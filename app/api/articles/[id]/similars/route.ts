import { NextRouteFunction } from '@/lib/route-validator.server';
import * as similarityService from '@/lib/article-metadata/similarity.server';
import * as redis from '@/lib/redis';
import { generateEmbeddingsFromPdf } from '@/trigger/ai';

type Params = { params: { id: string } };

const generateEmbeddingAsync = redis.cacheableFunction<string, { id: string }>(
  (metadataId) => redis.keys.generateEmbeddingForItem(metadataId),
  redis.asyncEmbeddingGenerationSchema,
  { ex: 60 * 60 }
)(async (metadataId) =>
  generateEmbeddingsFromPdf.trigger({ id: metadataId }, { idempotencyKey: `similarity-${metadataId}` })
);

const getSimilarArticlesByMetadataId: NextRouteFunction<Params> = async (_, { params }) => {
  const embeddingResult = await similarityService.getEmbeddingsByMetadataId(params.id);

  if (!embeddingResult.length) {
    await generateEmbeddingAsync(params.id);

    return Response.json({ data: [] }, { status: 404 });
  }

  const similarArticles = await similarityService.getSimilarByEmbedding({
    metadataId: params.id,
    embedding: embeddingResult,
  });

  return Response.json({ data: similarArticles }, { status: 200 });
};

export const GET = getSimilarArticlesByMetadataId;
