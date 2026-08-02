'use server';

import { Prisma } from '@prisma/client';
import { PineconeRecord } from '@pinecone-database/pinecone';
import { prismaClient } from '../prisma';
import * as redis from '../redis';
import { GetSimilarByEmbeddingParams, GetSimilarIdsByEmbeddingVectorParams } from './types';
import { researchArticleIndex, similaritySearchVectorWithScore } from '../vector-store';

/**
 * Aggregates similar items and returns a list of unique metadata IDs.
 *
 * @param similarItems - The array of arrays containing metadata IDs.
 * @param maxItemNum - The maximum number of items to return. Defaults to 3.
 * @returns An array of unique metadata IDs.
 */
const aggregateSimilarItems = (similarItems: string[][], maxItemNum = 3): string[] =>
  Array.from(new Set(similarItems.flatMap((similarItems) => similarItems.flat(2)))).slice(0, maxItemNum);

/**
 * Retrieves embeddings by metadata ID.
 * @param metadataId - The ID of the metadata.
 * @returns A promise that resolves to an array of EmbeddingResult.
 */
const _getEmbeddingsByMetadataId = async (metadataId: string): Promise<PineconeRecord[]> => {
  let idList: string[] = [];
  let paginationToken: string | undefined = undefined;

  do {
    const { vectors, pagination } = await researchArticleIndex.listPaginated({
      prefix: `${metadataId}#`,
      paginationToken,
    });

    if (!vectors?.length) {
      break;
    }

    idList = idList.concat(
      vectors.map((vector) => vector.id).filter((vectorId): vectorId is string => Boolean(vectorId))
    );
    paginationToken = pagination?.next;
  } while (paginationToken);

  if (!idList.length) {
    return [];
  }

  const result = await researchArticleIndex.fetch(idList);

  return Object.values(result.records);
};

export const getEmbeddingsByMetadataId = redis.cacheableFunction<string, redis.EmbeddingData>(
  redis.keys.metadataPineconeEmbeddingItems,
  redis.embeddingCacheSchema,
  // Cache for 1 day
  { ex: 60 * 60 * 24 }
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
    props.embeddingVectorList.map((embedding) => similaritySearchVectorWithScore(props.metadataId, embedding, 3, false))
  );

  if (similarItems.length === 0) {
    return [];
  }

  return aggregateSimilarItems(similarItems);
};

export const getSimilarIdsByEmbeddingVector = redis.cacheableFunction<GetSimilarIdsByEmbeddingVectorParams, string[]>(
  ({ metadataId }) => redis.keys.metadataSimilarIds(metadataId),
  redis.similarIdsCacheSchema,
  { ex: 60 * 60 * 24 },
  (result) => result.length === 0
)(_getSimilarIdsByEmbeddingVector);

/**
 * Retrieves a list of similar article metadata based on the provided embedding.
 * @param metadataId - The ID of the metadata to find similar articles for.
 * @param embedding - The embedding data used to find similar articles.
 * @returns A Promise that resolves to an array of similar article metadata.
 * @todo Cache the result.
 */
export const getSimilarByEmbedding = async (props: GetSimilarByEmbeddingParams) => {
  const similarIds = await getSimilarIdsByEmbeddingVector({
    metadataId: props.metadataId,
    embeddingVectorList: props.embedding.map((item) => item.values),
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
