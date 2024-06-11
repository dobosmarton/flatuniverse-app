import { logger, task } from '@trigger.dev/sdk/v3';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { GenerateAiContent } from '../schema';
import { generateEmbeddingsFromPdf } from './embedding-from-pdf';

export const generateAIContent = task({
  id: 'generate-ai-content',
  run: async (payload: GenerateAiContent) => {
    const metadataList = await articleMetadataService.getArticleMetadataIdsWithZeroEmbeddingsByIds(
      payload.map((payloadItem) => payloadItem.externalId)
    );

    logger.info(`Fetched metadata count: ${metadataList.length} - Done`, {
      time: new Date().toISOString(),
    });

    await generateEmbeddingsFromPdf.batchTrigger(
      metadataList.map((item) => ({ payload: { id: item.id, externalId: item.external_id } }))
    );
  },
});
