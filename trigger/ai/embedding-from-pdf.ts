import { logger, task } from '@trigger.dev/sdk/v3';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { loadPDF } from '@/lib/langchain/file-reader.server';
import { addNewEmbeddings } from '@/lib/langchain/embeddings.server';
import { MetadataIdPayload } from '../schema';

export const generateEmbeddingsFromPdf = task({
  id: 'generate-embedding-from-pdf',
  run: async (payload: MetadataIdPayload) => {
    logger.info(`Generate AI Content - Id: ${payload.id}`, { time: new Date().toISOString() });

    const pdfLink = await articleMetadataService.getArticlePdfLink(payload.id);

    if (!pdfLink) {
      logger.info(`PDF not found for metadata id: ${payload.id}`, { time: new Date().toISOString() });
      return;
    }

    logger.info(`Load PDF - Index: ${payload.id}`, { time: new Date().toISOString() });

    const pdfDocs = await loadPDF(pdfLink, { metadata_id: payload.id });

    logger.info(`PDF file loaded successfully! Length: ${pdfDocs.length}`, {
      time: new Date().toISOString(),
    });

    await addNewEmbeddings(payload.id, pdfDocs);

    logger.info(`Add Embeddings - Done`, { time: new Date().toISOString() });

    return { id: payload.id };
  },
  handleError: async (payload, error) => {
    logger.error(`Error generating embeddings: ${(error as Error).message}, id: ${payload.id}`, {
      time: new Date().toISOString(),
    });
  },
});
