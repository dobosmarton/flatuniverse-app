'use server';

import { Metadata, OpenAIEmbedding, Settings, TextNode } from 'llamaindex';
import { Prisma } from '@prisma/client';
import * as redis from '../redis';
import * as logger from '../logger';
import { addVectorsToIndex, listEmbeddings } from '../vector-store';

const openAIEmbeddings = new OpenAIEmbedding({
  model: 'text-embedding-ada-002',
});

Settings.embedModel = openAIEmbeddings;

export const _hasEmbeddingsForArticle = async (articleMetadataId: string) => {
  const result = await listEmbeddings(articleMetadataId, 1);

  return Boolean(result.vectors?.length);
};

export const hasEmbeddingsForArticle = redis.cacheableFunction<string, boolean>(
  redis.keys.hasEmbeddingsForArticle,
  redis.hasEmbeddingsForArticleSchema,
  { ex: 3600 }
)(_hasEmbeddingsForArticle);

export type HasEmbeddingsForArticle = Prisma.PromiseReturnType<typeof hasEmbeddingsForArticle>;

export const addNewEmbeddings = async <T extends Metadata>(metadataId: string, nodes: TextNode<T>[]) => {
  try {
    logger.log('Adding embeddings to vector store', nodes.length);

    await addVectorsToIndex(nodes);

    const keys = [
      redis.keys.hasEmbeddingsForArticle(metadataId),
      redis.keys.metadataPineconeEmbeddingItems(metadataId),
      redis.keys.metadataSimilarIds(metadataId),
    ];

    await redis.revalidateKeys(...keys);

    logger.log(`Cache keys revalidated, keys: ${keys.join(', ')}`);
  } catch (error) {
    logger.error('Error in embeddings chain:', error);
    throw error;
  }
};
