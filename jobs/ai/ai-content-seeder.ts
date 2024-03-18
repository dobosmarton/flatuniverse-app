import { client } from '@/trigger';
import { invokeTrigger } from '@trigger.dev/sdk';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import * as tasks from './tasks/generate-embedding';

const batchSize = 50;

client.defineJob({
  id: 'ai-content-seeder',
  name: 'AI Content Seeder',
  version: '0.0.2',
  trigger: invokeTrigger(),
  run: async (_, io) => {
    const metadataList = await io.runTask('fetch-article-metadata', async () => {
      const metadataList = await articleMetadataService.getArticleMetadataIdsWithZeroEmbeddings(0, batchSize);

      await io.logger.info(`Fetched metadata count: ${metadataList.length} - Done`, {
        time: new Date().toISOString(),
      });

      return metadataList;
    });

    for (const item of metadataList) {
      try {
        await tasks.generateContent(`seed-ai-content-${item.id}`, io, item);
      } catch (error) {
        const error = (error as Error).message ?? error;
        await io.logger.error(
          `Error in generating AI content for metadata id: ${item.id}, error: ${JSON.stringify(errorMessage)}`,
          {
            time: new Date().toISOString(),
            error,
          }
        );
      }
    }
  },
});
