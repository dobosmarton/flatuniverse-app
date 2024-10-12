import { logger, task } from '@trigger.dev/sdk/v3';
import * as embeddingService from '@/lib/embeddings/embeddings.server';
import { GenerateAiContentPayload, generateAiContentPayloadSchema } from '../schema';
import { generateEmbeddingsFromPdf } from './embedding-from-pdf';

export const generateAIContent = task({
  id: 'generate-ai-content',
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
