import { logger, task } from '@trigger.dev/sdk/v3';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';

import { AddArticleMetadaBatchPayload, addArticleMetadaBatchPayloadSchema } from '../schema';
// import { generateAIContent } from '../ai/generate-ai-content';

/**
 * This task is used to add a batch of article metadata to the database.
 * It is triggered by the `add-article-metadata-batch` event.
 *
 * Input: AddArticleMetadaBatchPayload - The payload contains the batch of article metadata and the batch index
 * Output: void
 *
 * 1. Parse the payload - validate the payload
 * 2. Add the article metadata to the database by calling the `addNewArticleMetadata` function
 */
export const addArticleMetadaBatch = task({
  id: 'add-article-metadata-batch',
  run: async (_payload: AddArticleMetadaBatchPayload) => {
    const payload = addArticleMetadaBatchPayloadSchema.parse(_payload);

    logger.info(`Add Article Metadata Batch - Index: ${payload.batchIndex}, size: ${payload.batch.length}`, {
      time: new Date().toISOString(),
    });

    const newIds = await articleMetadataService.addNewArticleMetadata(payload.batch);

    /*    if (!newIds?.length) {
      logger.info(`No new metadata found`, { time: new Date().toISOString() });
      return;
    } */

    logger.info(`Added metadata count for jobId: ${payload.jobId}: ${newIds?.length ?? 0}`, {
      time: new Date().toISOString(),
    });

    /* await generateAIContent.trigger(
      { data: newIds.map((id) => ({ externalId: id })), jobId: payload.jobId },
      { idempotencyKey: `generate-ai-content-${payload.jobId}-${payload.batchIndex}` }
    ); */

    // logger.info(`Add Article Metadata Batch - Done`, { time: new Date().toISOString() });
  },
  handleError: async (payload, error) => {
    logger.error(`Error adding article metadata: ${(error as Error).message}, index: ${payload.batchIndex}`, {
      time: new Date().toISOString(),
    });
  },
});
