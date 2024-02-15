'use server';

import { Prisma } from '@prisma/client';
import { prismaClient } from '../prisma';
import { SimilarityModel, SimilarityResult } from './types';

/**
 * Performs a similarity search with the specified vector and returns the
 * results along with their scores.
 * @param query The vector to use for the similarity search.
 * @param k The number of results to return.
 * @returns A promise that resolves with the search results and their scores.
 */
const similaritySearchVectorWithScore = async (metadataId: string, queryVector: number[], k: number) => {
  const selectRaw = Prisma.raw(['id', 'metadata_id'].map((x) => `"${x}"`).join(', '));

  const vector = `[${queryVector.join(',')}]`;
  const articles = await prismaClient.$queryRaw<Array<SimilarityModel>>(
    Prisma.join(
      [
        Prisma.sql`
          SELECT ${selectRaw}, "embedding" <=> ${vector}::vector as "_distance"
          FROM "public"."research_article_embedding"
          WHERE "metadata_id" != ${metadataId}
        `,
        Prisma.sql`
          ORDER BY "_distance" ASC
          LIMIT ${k};
        `,
      ].filter((x) => x != null),
      ''
    )
  );

  const results: [SimilarityResult, number][] = [];
  for (const article of articles) {
    if (article._distance != null) {
      results.push([{ id: article.id, metadata_id: article.metadata_id }, article._distance]);
    }
  }

  return results;
};

export const similaritySearch = async (metadataId: string, queryVector: number[], k = 3) => {
  const results = await similaritySearchVectorWithScore(metadataId, queryVector, k);

  return results.map((result) => result[0]);
};
