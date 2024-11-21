import { logger, task } from '@trigger.dev/sdk/v3';
import { MetadataIdPayload, metadataIdPayloadSchema } from '../schema';
import { addNewEmbeddings } from '@/lib/embeddings/embeddings.server';
import { getArticleWithPdfLink } from '@/lib/article-metadata/metadata.server';
import { loadPDF } from '@/lib/file-handlers';

/**
 * This task is used to generate embeddings from a PDF file.
 * It is triggered by the `generate-embedding-from-pdf` event.
 *
 * Input: MetadataIdPayload - The payload contains the id of the article metadata
 * Output: { id: string } - The id of the article metadata
 *
 * 1. Get the PDF link from the article metadata
 * 2. Load the PDF file
 * 3. Generate embeddings
 * 4. Add the embeddings to the database
 */

export const generateEmbeddingsFromPdf = task({
  id: 'generate-embedding-from-pdf',
  machine: {
    preset: 'small-2x',
  },
  run: async (_payload: MetadataIdPayload) => {
    const payload = metadataIdPayloadSchema.parse(_payload);
    logger.info(`Generate Embedding from pdf - Id: ${payload.id}`, { time: new Date().toISOString() });

    const metadata = await getArticleWithPdfLink(payload.id);

    if (!metadata?.pdfLink) {
      logger.info(`PDF not found for metadata id: ${payload.id}`, {
        time: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Load PDF - Index: ${payload.id}`, { time: new Date().toISOString() });

    const pdfNodes = await loadPDF(metadata.pdfLink, {
      metadata_id: payload.id,
      published: metadata.published,
    });

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
