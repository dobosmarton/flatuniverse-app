import { client } from '@/trigger';
import { eventTrigger } from '@trigger.dev/sdk';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { Events, addArticleMetadaBatchPayloadSchema } from '../events';

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

      await io.logger.info(`Add Article Metadata Batch - Done`, {
        time: new Date().toISOString(),
      });
    });

    return { payload, ctx };
  },
});
