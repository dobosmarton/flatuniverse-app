import { logger, task } from '@trigger.dev/sdk/v3';
import * as embeddingService from '@/lib/embeddings/embeddings.server';
import { GenerateAiContentPayload, generateAiContentPayloadSchema } from '../schema';
import { generateEmbeddingsFromPdf } from './embedding-from-pdf';

/**
 * This task is used to generate AI content for a list of article metadata.
 * It is triggered by the `generate-ai-content` event.
 *
 * Input: GenerateAiContentPayload - The payload contains the list of article metadata ids and external ids
 * Output: void
 *
 * 1. Check if the article metadata has embeddings by calling the `hasEmbeddingsForArticle` function
 * 2. If not, trigger the `generate-embedding-from-pdf` task for each article metadata in batch
 */
export const generateAIContent = task({
  id: 'generate-ai-content',
  machine: {
    preset: 'small-2x',
  },
  run: async (_payload: GenerateAiContentPayload) => {
    const payload = generateAiContentPayloadSchema.parse(_payload);

    let metadataList: { id: string; external_id: string }[] = [];
    for (const item of payload.data) {
      const hasEmbeddings = await embeddingService.hasEmbeddingsForArticle(item.articleMetadataId);
      if (!hasEmbeddings) {
        metadataList.push({ id: item.articleMetadataId, external_id: item.externalId });
      }
    }

    logger.info(`Fetched metadata count: ${metadataList.length} - Done`, {
      time: new Date().toISOString(),
    });

    const result = await generateEmbeddingsFromPdf.batchTrigger(
      metadataList.map((item) => ({
        payload: { id: item.id, externalId: item.external_id, jobId: payload.jobId },
        options: { idempotencyKey: `generate-embedding-from-pdf-${payload.jobId}-${item.id}` },
      }))
    );

    logger.info(
      `Triggered embeddings generation: ${result.batchId}, ids: ${result.runs.map((run) => run.id).join(',')} - Done`,
      {
        time: new Date().toISOString(),
      }
    );
  },
});
