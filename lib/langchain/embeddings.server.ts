'use server';

import pgvector from 'pgvector/utils';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { prismaClient } from '../prisma';
import { PDFMetadata } from './types';
import * as redis from '../redis';
import * as logger from '../logger';

const openAIEmbeddings = new OpenAIEmbeddings();

const addVectors = async (
  vectors: number[][],
  documents: Document<PDFMetadata<{ metadata_id: string }>>[]
): Promise<number[]> =>
  prismaClient.$transaction(
    vectors.map((vector, idx) => {
      const embedding = pgvector.toSql(vector);
      const documentMetadata = documents[idx].metadata;

      // vector field can be updated only via raw SQL
      return prismaClient.$executeRaw`
        INSERT INTO "public"."research_article_embedding" ("embedding", "doucment_metadata", "metadata_id")
        VALUES (${embedding}::vector, ${JSON.stringify({
        totalPages: documentMetadata.pdf.totalPages,
        pageNumber: documentMetadata.loc.pageNumber,
      })}, ${documentMetadata.article.metadata_id});
      `;
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
