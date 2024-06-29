'use server';

import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { PDFMetadata } from './types';
import * as redis from '../redis';
import * as logger from '../logger';
import { researchArticleIndex } from '../pinecone';

const openAIEmbeddings = new OpenAIEmbeddings();

const addVectors = async (
  vectors: number[][],
  documents: Document<PDFMetadata<{ metadata_id: string }>>[]
): Promise<void> =>
  researchArticleIndex.upsert(
    vectors.map((vector, idx) => {
      const documentMetadata = documents[idx].metadata;

      return {
        id: `${documentMetadata.article.metadata_id}#${documentMetadata.loc.pageNumber}`,
        values: vector,
      };
    })
  );

export const addNewEmbeddings = async (metadataId: string, docs: Document<PDFMetadata<{ metadata_id: string }>>[]) => {
  try {
    logger.log('Adding embeddings to vector store', docs.length);

    const vectors = await openAIEmbeddings.embedDocuments(docs.map((doc) => doc.pageContent));

    logger.log('Embed documents was invoked! 💰');

    await addVectors(vectors, docs);

    await redis.revalidateKeys(
      redis.keys.hasEmbeddingsForArticle(metadataId),
      redis.keys.metadataEmbeddingItems(metadataId)
    );
  } catch (error) {
    logger.error('Error in embeddings chain:', error);
    throw error;
  }
};
