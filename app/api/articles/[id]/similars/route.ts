import { randomUUID } from 'crypto';
import { NextRouteFunction } from '@/lib/route-validator.server';
import * as similarityService from '@/lib/article-metadata/similarity.server';
import * as redis from '@/lib/redis';
import { generateEmbeddingsFromPdf } from '@/trigger/ai';

type Params = { params: { id: string } };

const generateEmbeddingAsync = redis.cacheableFunction<string, { id: string }>(
  redis.keys.generateEmbeddingForItem,
  redis.asyncEmbeddingGenerationSchema,
  { ex: 60 * 60 }
)(async (metadataId) =>
  generateEmbeddingsFromPdf.trigger(
    { id: metadataId, jobId: randomUUID() },
    { idempotencyKey: `similarity-${metadataId}` }
  )
);

const getSimilarArticlesByMetadataId: NextRouteFunction<Params> = async (_, { params }) => {
  const embeddingResult = await similarityService.getEmbeddingsByMetadataId(params.id);

  if (!embeddingResult.length) {
    await generateEmbeddingAsync(params.id);

    return Response.json({ data: [] }, { headers: { 'Retry-After': '5' }, status: 200 });
  }

  const similarArticles = await similarityService.getSimilarByEmbedding({
    metadataId: params.id,
    embedding: embeddingResult,
  });

  return Response.json({ data: similarArticles }, { status: 200 });
};

export const GET = getSimilarArticlesByMetadataId;
