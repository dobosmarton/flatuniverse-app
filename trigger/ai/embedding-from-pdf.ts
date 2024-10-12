import { logger, task } from '@trigger.dev/sdk/v3';
import { MetadataIdPayload, metadataIdPayloadSchema } from '../schema';
import { addNewEmbeddings } from '@/lib/embeddings/embeddings.server';
import { getArticlePdfLink } from '@/lib/article-metadata/metadata.server';
import { loadPDF } from '@/lib/file-handlers';

export const generateEmbeddingsFromPdf = task({
  id: 'generate-embedding-from-pdf',
  run: async (_payload: MetadataIdPayload) => {
    const payload = metadataIdPayloadSchema.parse(_payload);
    logger.info(`Generate Embedding from pdf - Id: ${payload.id}`, { time: new Date().toISOString() });

    const pdfLink = await getArticlePdfLink(payload.id);

    if (!pdfLink) {
      logger.info(`PDF not found for metadata id: ${payload.id}`, {
        time: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Load PDF - Index: ${payload.id}`, { time: new Date().toISOString() });

    const pdfNodes = await loadPDF(pdfLink, { metadata_id: payload.id });

    if (!pdfNodes.length) {
      throw new Error(`PDF not found for metadata id: ${payload.id}`);
    }

    logger.info(`PDF file loaded successfully! Length: ${pdfNodes.length}, jobId: ${payload.jobId}`, {
      time: new Date().toISOString(),
    });

    await addNewEmbeddings(payload.id, pdfNodes);

    logger.info(`Add Embeddings - Done`, { time: new Date().toISOString() });

    return { id: payload.id };
  },
  handleError: async (payload, error) => {
    logger.error(`Error generating embeddings: ${(error as Error).message}, id: ${payload.id}`, {
      time: new Date().toISOString(),
    });
  },
});
