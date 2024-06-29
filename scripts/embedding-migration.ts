import 'dotenv/config';
import { researchArticleIndex } from '@/lib/pinecone';
import { prismaClient } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';

const BATCH_SIZE = 100;

type ResearchArticle = {
  created_at: Date;
  metadata_id: string;
  doucment_metadata: Prisma.JsonValue;
  id: string;
  updated_at: Date;
  embedding: number[];
};

const migrateEmbeddings = async () => {
  console.log('Migrating embeddings...');

  const reasearchArticleIds = await prismaClient.research_article_embedding.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  console.log(`Found ${reasearchArticleIds.length} articles`);

  // split into batches
  const batches: { id: string }[][] = [];
  for (let i = 0; i < reasearchArticleIds.length; i += BATCH_SIZE) {
    batches.push(reasearchArticleIds.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${batches.length} batches`);

  let batchIndex = 0;
  // process each batch
  for (const batch of batches) {
    console.log(`Processing batch ${batchIndex++}, size: ${batch.length}`);

    const articles = await prismaClient.$queryRaw<ResearchArticle[]>`
        SELECT id, metadata_id, embedding, doucment_metadata FROM "public"."research_article_embedding"
        WHERE id IN (${Prisma.join(batch.map((item) => item.id))});
  `;

    console.log(`Fetched ${articles.length} articles`);

    articles.forEach((article) => {
      /* console.log(
        `Processing article ${(article.doucment_metadata as { pageNumber: number }).pageNumber}, ${
          article.embedding.length
        }`
      ); */

      if (!(article.doucment_metadata as any).pageNumber) {
        throw new Error('Missing page number in metadata');
      }
    });

    // create embeddings in pinecone
    await researchArticleIndex.upsert(
      articles.map<PineconeRecord<RecordMetadata>>((article) => {
        const parsedMetadata = article.doucment_metadata as { pageNumber: number };
        console.log(
          `Processing article id: ${article.metadata_id}#${parsedMetadata.pageNumber}, ${parsedMetadata.pageNumber}, ${article.embedding.length}`
        );
        return {
          id: `${article.metadata_id}#${parsedMetadata.pageNumber}`,
          values: article.embedding,
        };
      })
    );
  }
};

migrateEmbeddings();
