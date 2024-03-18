import { client } from '@/trigger';
import { eventTrigger } from '@trigger.dev/sdk';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import * as tasks from './tasks/generate-embedding';
import { Events } from '../events';
import { generateAiContentSchema } from '../event-schema';

client.defineJob({
  id: 'generate-ai-content',
  name: 'Generate AI Content',
  version: '0.0.1',
  trigger: eventTrigger({
    name: Events.generate_ai_content,
    schema: generateAiContentSchema,
  }),
  run: async (payload, io, ctx) => {
    const result = await io.runTask(`fetch-metadata-with-zero-embeddings-${ctx.event.context.jobId}`, async () => {
      const metadataList = await articleMetadataService.getArticleMetadataIdsWithZeroEmbeddingsByIds(
        payload.map((payloadItem) => payloadItem.externalId)
      );

      await io.logger.info(`Fetched metadata count: ${metadataList.length} - Done`, {
        time: new Date().toISOString(),
      });

      return metadataList;
    });

    for (const item of result) {
      try {
        await tasks.generateContent(`generate-ai-content-${ctx.event.context.jobId}-${item.id}`, io, item);
      } catch (error) {
        const errorMessage = (error as Error).message ?? error;
        await io.logger.error(
          `Error in generating AI content for metadata id: ${item.id}, error: ${JSON.stringify(errorMessage)}`,
          {
            time: new Date().toISOString(),
            error,
          }
        );
      }
    }

    return { payload, ctx };
  },
});
