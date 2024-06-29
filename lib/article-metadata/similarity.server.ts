'use server';

import { Prisma } from '@prisma/client';
import { similaritySearch } from '../langchain/similarity.server';
import { prismaClient } from '../prisma';
import { SimilarityResult } from '../langchain/types';
import { EmbeddingData, embeddingDataSchema } from './schema';
import * as redis from '../redis';
import { GetSimilarByEmbeddingParams, GetSimilarIdsByEmbeddingVectorParams } from './types';

type QueryResult = {
  id: string;
  metadata_id: string;
  embedding: string;
};

/**
 * Aggregates similar items and returns a list of unique metadata IDs.
 *
 * @param similarItems - The array of arrays containing SimilarityResult objects.
 * @param maxItemNum - The maximum number of items to return. Defaults to 3.
 * @returns An array of unique metadata IDs.
 */
const aggregateSimilarItems = (similarItems: SimilarityResult[][], maxItemNum = 3) => {
  const metadataIds = similarItems.flatMap((items) => items).map((item) => item.metadata_id);

  return Array.from(new Set<string>(metadataIds)).slice(0, maxItemNum);
};

/**
 * Retrieves embeddings by metadata ID.
 * @param metadataId - The ID of the metadata.
 * @returns A promise that resolves to an array of EmbeddingResult.
 */
const _getEmbeddingsByMetadataId = async (metadataId: string): Promise<EmbeddingData> => {
  const results = await prismaClient.$queryRaw<QueryResult[]>`
        SELECT id, metadata_id, embedding FROM "public"."research_article_embedding"
        WHERE metadata_id = ${metadataId};
  `;

  if (results.length === 0) {
    return [];
  }

  return embeddingDataSchema.parse(results);
};

export const getEmbeddingsByMetadataId = redis.cacheableFunction<string, EmbeddingData>(
  (metadataId) => redis.keys.metadataEmbeddingItems(metadataId),
  redis.embeddingCacheSchema,
  { ex: 1800 }
)(_getEmbeddingsByMetadataId);

/**
 * Retrieves similar item IDs based on the given embedding vector.
 *
 * @param metadataId - The ID of the metadata.
 * @param embeddingVectorList - The list of embedding vectors to compare against.
 * @returns A Promise that resolves to the aggregated similar item IDs.
 */
const _getSimilarIdsByEmbeddingVector = async (props: GetSimilarIdsByEmbeddingVectorParams): Promise<string[]> => {
  const similarItems = await Promise.all(
    props.embeddingVectorList.map((embedding) => similaritySearch(props.metadataId, embedding))
  );

  if (similarItems.length === 0) {
    return [];
  }

  return aggregateSimilarItems(similarItems);
};

export const getSimilarIdsByEmbeddingVector = redis.cacheableFunction<GetSimilarIdsByEmbeddingVectorParams, string[]>(
  ({ metadataId }) => redis.keys.metadataSimilarIds(metadataId),
  redis.similarIdsCacheSchema,
  { ex: 60 },
  (result) => result.length === 0
)(_getSimilarIdsByEmbeddingVector);

/**
 * Retrieves a list of similar article metadata based on the provided embedding.
 * @param metadataId - The ID of the metadata to find similar articles for.
 * @param embedding - The embedding data used to find similar articles.
 * @returns A Promise that resolves to an array of similar article metadata.
 */
export const getSimilarByEmbedding = async (props: GetSimilarByEmbeddingParams) => {
  const similarIds = await getSimilarIdsByEmbeddingVector({
    metadataId: props.metadataId,
    embeddingVectorList: props.embedding.map((item) => item.embedding),
  });

  if (similarIds.length === 0) {
    return [];
  }

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

export type SimilarArticleMetadataList = Prisma.PromiseReturnType<typeof getSimilarByEmbedding>;
