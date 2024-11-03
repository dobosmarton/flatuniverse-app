import 'dotenv/config';
import { researchArticleIndex } from '../lib/vector-store';
import { PrismaClient } from '@prisma/client';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const prismaClient = new PrismaClient();

const migratePinceoneTimestampMetadata = async () => {
  console.log('Migrating timestamp metadata...');

  let paginationToken: string | undefined = undefined;
  let count = 0;
  let total = 0;

  do {
    const results = await researchArticleIndex.listPaginated({
      paginationToken,
    });

    console.log(`Fetched ${results.vectors?.length} articles`);

    if (!results.vectors) {
      break;
    }

    const filteredVectors = results.vectors.filter((vector): vector is { id: string } => Boolean(vector.id));
    const metadataIds = filteredVectors.map((vector) => vector.id.split('#')[0]);

    const fetchedVectors = await researchArticleIndex.fetch(filteredVectors.map((vector) => vector.id));

    console.log(`Fetched ${Object.keys(fetchedVectors.records).length} vectors`);

    // console.log(`Usage stats: ${JSON.stringify(fetchedVectors.usage, null, 2)}`);

    const metadataList = await prismaClient.article_metadata.findMany({
      where: {
        id: { in: metadataIds },
      },
      select: { id: true, published: true },
    });

    const updated = await Promise.all(
      filteredVectors.map(async (vector) => {
        const [metadataId] = vector.id.split('#');

        const vectorMetadata = fetchedVectors.records[vector.id]?.metadata;

        if (vectorMetadata?.timestamp && typeof vectorMetadata.timestamp === 'number') {
          // console.log(`${vector.id} already has timestamp metadata, skipping...`);
          return;
        }

        const metadata = metadataList.find((metadata) => metadata.id === metadataId);

        if (!metadata) {
          return;
        }

        try {
          await researchArticleIndex.update({
            id: vector.id,
            metadata: {
              timestamp: metadata.published.getTime(),
            },
          });
        } catch (error) {
          console.error(`Error updating ${vector.id}`, (error as Error).message);
          // wait 1 min
          await wait(60000);

          // retry the failed update
          await researchArticleIndex.update({
            id: vector.id,
            metadata: {
              timestamp: metadata.published.getTime(),
            },
          });
        }

        return vector.id;
      })
    );

    const filtered = updated.filter((item): item is string => Boolean(item));

    total += updated.length;
    count += filtered.length;
    console.log(`Updated ${filtered.length} articles, total updated: ${count}, total: ${total}`);

    paginationToken = results.pagination?.next;

    // wait 1 second
    await wait(500);
  } while (paginationToken);
};

migratePinceoneTimestampMetadata();
