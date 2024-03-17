import { client } from '@/trigger';
import { eventTrigger } from '@trigger.dev/sdk';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { Events } from '../events';
import { addArticleMetadaBatchPayloadSchema } from '../event-schema';

client.defineJob({
  id: 'add-article-metadata-batch',
  name: 'Add Article Metadata Batch',
  version: '0.0.1',
  trigger: eventTrigger({
    name: Events.add_article_metadata_batch,
    schema: addArticleMetadaBatchPayloadSchema,
  }),
  concurrencyLimit: 1,
  run: async (payload, io, ctx) => {
    await io.runTask(`add-new-article-metadata-${ctx.event.context.jobId}-${payload.batchIndex}`, async () => {
      await io.logger.info(`Add Article Metadata Batch - Index: ${payload.batchIndex}, size: ${payload.batch.length}`, {
        time: new Date().toISOString(),
      });

      await articleMetadataService.addNewArticleMetadata(payload.batch);

      await io.sendEvent(`${Events.generate_ai_content}-${ctx.event.context.jobId}-${payload.batchIndex}`, {
        name: Events.generate_ai_content,
        context: {
          jobId: ctx.event.context.jobId,
        },
        payload,
      });

      await io.logger.info(`Add Article Metadata Batch - Done`, {
        time: new Date().toISOString(),
      });
    });

    return { payload, ctx };
  },
});
