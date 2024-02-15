'use server';

import { Prisma } from '@prisma/client';
import { prismaClient } from '../prisma';

export const hasEmbeddingsForArticle = async (articleMetadataId: string) => {
  const result = await prismaClient.research_article_embedding.count({
    where: {
      metadata_id: articleMetadataId,
    },
  });

  return result > 0;
};

export type HasEmbeddingsForArticle = Prisma.PromiseReturnType<typeof hasEmbeddingsForArticle>;
