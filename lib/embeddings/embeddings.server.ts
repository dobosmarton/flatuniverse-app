'use server';

import { Prisma } from '@prisma/client';
import { prismaClient } from '../prisma';
import * as redis from '../redis';

export const _hasEmbeddingsForArticle = async (articleMetadataId: string) => {
  const result = await prismaClient.research_article_embedding.count({
    where: {
      metadata_id: articleMetadataId,
    },
  });

  return result > 0;
};

export const hasEmbeddingsForArticle = redis.cacheableFunction<string, boolean>(
  (metadataId) => redis.keys.hasEmbeddingsForArticle(metadataId),
  redis.hasEmbeddingsForArticleSchema,
  { ex: 3600 }
)(_hasEmbeddingsForArticle);

export type HasEmbeddingsForArticle = Prisma.PromiseReturnType<typeof hasEmbeddingsForArticle>;
