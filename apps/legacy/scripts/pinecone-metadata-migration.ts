import { researchArticleIndex } from '@/lib/vector-store';
import 'dotenv/config';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const migratePinceoneMetadata = async () => {
  console.log('Migrating metadata...');

  let paginationToken: string | undefined = undefined;
  let count = 0;

  do {
    const results = await researchArticleIndex.listPaginated({
      paginationToken,
    });

    console.log(`Fetched ${results.vectors?.length} articles`);

    if (!results.vectors) {
      break;
    }

    const updated = await Promise.all(
      results.vectors.map(async (vector) => {
        if (!vector.id) {
          return;
        }

        const [metadataId] = vector.id.split('#');
        try {
          await researchArticleIndex.update({
            id: vector.id,
            metadata: {
              metadataId,
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
              metadataId,
            },
          });
        }

        return vector.id;
      })
    );

    const filtered = updated.filter((item): item is string => Boolean(item));

    count += filtered.length;
    console.log(`Updated ${filtered.length} articles, total: ${count}`);

    paginationToken = results.pagination?.next;
  } while (paginationToken);
};

migratePinceoneMetadata();
