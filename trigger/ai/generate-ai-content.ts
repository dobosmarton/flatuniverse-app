import { logger, task } from '@trigger.dev/sdk/v3';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { GenerateAiContentPayload, generateAiContentPayloadSchema } from '../schema';
import { generateEmbeddingsFromPdf } from './embedding-from-pdf';

export const generateAIContent = task({
  id: 'generate-ai-content',
  run: async (_payload: GenerateAiContentPayload) => {
    const payload = generateAiContentPayloadSchema.parse(_payload);

    const metadataList = await articleMetadataService.getArticleMetadataIdsWithZeroEmbeddingsByIds(
      payload.data.map((payloadItem) => payloadItem.externalId)
    );

    logger.info(`Fetched metadata count: ${metadataList.length} - Done`, {
      time: new Date().toISOString(),
    });

    await generateEmbeddingsFromPdf.batchTrigger(
      metadataList.map((item) => ({
        payload: { id: item.id, externalId: item.external_id, jobId: payload.jobId },
        options: { idempotencyKey: `generate-embedding-from-pdf-${payload.jobId}-${item.id}` },
      }))
    );
  },
});
