'use server';

import { Prisma } from '@prisma/client';
import { similaritySearch } from '../langchain/similarity.server';
import { prismaClient } from '../prisma';
import { SimilarityResult } from '../langchain/types';

type QueryResult = {
  id: string;
  metadata_id: string;
  embedding: string;
};

const aggregateSimilarItems = (similarItems: SimilarityResult[][], maxItemNum = 3) => {
  const metadataIds = similarItems.flatMap((items) => items).map((item) => item.metadata_id);

  return Array.from(new Set<string>(metadataIds)).slice(0, maxItemNum);
};

export const getSimilarIdsByMetadataId = async (metadataId: string) => {
  const results = await prismaClient.$queryRaw<QueryResult[]>`
        SELECT id, metadata_id, embedding FROM "public"."research_article_embedding"
        WHERE metadata_id = ${metadataId};
  `;

  const similarItems = await Promise.all(
    results.map((result) => similaritySearch(metadataId, JSON.parse(result.embedding)))
  );

  const aggregated = aggregateSimilarItems(similarItems);

  return aggregated;
};

export const getSimilarByMetadataId = async (metadataId: string) => {
  const similarIds = await getSimilarIdsByMetadataId(metadataId);

  const articleMetadataList = await prismaClient.article_metadata.findMany({
    where: {
      id: { in: similarIds },
    },
    include: {
      authors: { select: { author: { select: { name: true } } } },
      categories: {
        select: { category: { select: { short_name: true, full_name: true, group_name: true } } },
      },
      links: { select: { link: { select: { href: true, rel: true, type: true, title: true } } } },
    },
  });

  return articleMetadataList.map((metadata) => ({
    ...metadata,
    published: metadata.published.toDateString(),
    updated: metadata.updated.toDateString(),
  }));
};

export type SimilarArticleMetadataList = Prisma.PromiseReturnType<typeof getSimilarByMetadataId>;
