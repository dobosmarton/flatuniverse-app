'use server';

import { researchArticleIndex } from '../pinecone';
import { PineconeRecord } from '@pinecone-database/pinecone';
import { SimilarityResult } from './types';

type PineconeRecordWithMetadataId = PineconeRecord & {
  metadata: {
    metadataId: string;
  };
};

const ITERATION_LIMIT = 10;

/**
 * Performs a similarity search with the specified vector and returns the
 * results along with their scores.
 * @param query The vector to use for the similarity search.
 * @param k The number of results to return.
 * @param includeValues Whether to include values in the search results.
 * @returns A promise that resolves with the search results and their scores.
 */
const similaritySearchVectorWithScore = async (
  metadataId: string,
  queryVector: number[],
  k: number,
  includeValues: boolean
): Promise<string[]> => {
  const collectedMetadataIds = new Set<string>();
  let iteration = 0;

  console.log('similaritySearchVectorWithScore', metadataId);

  while (collectedMetadataIds.size < k && iteration < ITERATION_LIMIT) {
    const result = await researchArticleIndex.query({
      vector: queryVector,
      topK: k,
      includeMetadata: true,
      includeValues,
      filter: {
        metadataId: { $nin: [...Array.from(collectedMetadataIds), metadataId] },
      },
    });

    if (result.matches.length === 0) {
      break;
    }

    const filteredMetadataIds = result.matches.filter((match): match is PineconeRecordWithMetadataId =>
      Boolean(match.metadata?.metadataId)
    );

    for (const match of filteredMetadataIds) {
      collectedMetadataIds.add(match.metadata.metadataId);
    }

    iteration++;
  }

  return Array.from(collectedMetadataIds);
};

export const similaritySearch = async (
  metadataId: string,
  queryVector: number[],
  k = 3,
  includeValues = false
): Promise<SimilarityResult> => {
  const result = await similaritySearchVectorWithScore(metadataId, queryVector, k, includeValues);

  return {
    metadataId,
    similarItems: result,
  };
};
