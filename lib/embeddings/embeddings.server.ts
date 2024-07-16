'use server';

import { Prisma } from '@prisma/client';
import * as redis from '../redis';
import { researchArticleIndex } from '../pinecone';

export const _hasEmbeddingsForArticle = async (articleMetadataId: string) => {
  const result = await researchArticleIndex.listPaginated({
    prefix: `${articleMetadataId}#`,
    limit: 1,
  });

  return Boolean(result.vectors?.length);
};

export const hasEmbeddingsForArticle = redis.cacheableFunction<string, boolean>(
  redis.keys.hasEmbeddingsForArticle,
  redis.hasEmbeddingsForArticleSchema,
  { ex: 3600 }
)(_hasEmbeddingsForArticle);

export type HasEmbeddingsForArticle = Prisma.PromiseReturnType<typeof hasEmbeddingsForArticle>;
