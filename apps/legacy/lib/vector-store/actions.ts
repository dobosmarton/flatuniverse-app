import type { Metadata, TextNode } from 'llamaindex';
import { researchArticleIndex } from './client';
import { createPineconeId } from './utils';
import { Index, ListResponse, RecordMetadata } from '@pinecone-database/pinecone';

/**
 * Retrieves a paginated list of embeddings from the vector store.
 *
 * @param {string} articleMetadataId - The unique identifier for the article metadata.
 * @param {number} [limit=100] - The maximum number of embeddings to retrieve (default is 100).
 * @param {Index<RecordMetadata>} [vectorStoreIndex=researchArticleIndex] - The vector store index to query (default is researchArticleIndex).
 * @returns {Promise<Object>} A promise that resolves to the paginated list of embeddings.
 */
export const listEmbeddings = async (
  articleMetadataId: string,
  limit: number = 100,
  vectorStoreIndex: Index<RecordMetadata> = researchArticleIndex
): Promise<ListResponse> =>
  vectorStoreIndex.listPaginated({
    prefix: `${articleMetadataId}#`,
    limit,
  });

/**
 * Adds vectors and their associated document metadata to the vector store index.
 *
 * @param {TextNode<T>[]} nodes - An array of documents containing metadata for each vector.
 * @param {Index<RecordMetadata>} [vectorStoreIndex=researchArticleIndex] - The vector store index to update (default is researchArticleIndex).
 * @returns {Promise<void>} A promise that resolves when the upsert operation is complete.
 */
export const addVectorsToIndex = async <T extends Metadata>(
  nodes: TextNode<T>[],
  vectorStoreIndex: Index<RecordMetadata> = researchArticleIndex
): Promise<void> =>
  vectorStoreIndex.upsert(
    nodes.map((node, idx) => {
      return {
        id: createPineconeId(node.metadata.metadata_id, idx),
        values: node.getEmbedding(),
        metadata: node.metadata,
      };
    })
  );

/**
 * Performs a similarity search with the specified vector and returns the
 * results along with their scores.
 * @param query The vector to use for the similarity search.
 * @param k The number of results to return.
 * @param includeValues Whether to include values in the search results.
 * @param iterationLimit The number of iterations to perform the search.
 * @returns A promise that resolves with the search results and their scores.
 */
export const similaritySearchVectorWithScore = async (
  metadataId: string,
  queryVector: number[],
  k: number,
  includeValues: boolean,
  iterationLimit: number = 10
): Promise<string[]> => {
  const collectedMetadataIds = new Set<string>();
  let iteration = 0;

  while (collectedMetadataIds.size < k && iteration < iterationLimit) {
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

    for (const match of result.matches) {
      if (match.metadata && typeof match.metadata.metadataId === 'string') {
        collectedMetadataIds.add(match.metadata.metadataId);
      }
    }

    iteration++;
  }

  return Array.from(collectedMetadataIds);
};
