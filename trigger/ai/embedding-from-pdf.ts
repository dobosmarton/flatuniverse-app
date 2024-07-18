import { logger, task } from '@trigger.dev/sdk/v3';
import { MetadataIdPayload, metadataIdPayloadSchema } from '../schema';
import { loadPdf } from './load-pdf';
import { generateEmbedding } from './generate-embedding';

export const generateEmbeddingsFromPdf = task({
  id: 'generate-embedding-from-pdf',
  run: async (_payload: MetadataIdPayload) => {
    const payload = metadataIdPayloadSchema.parse(_payload);
    logger.info(`Generate Embedding from pdf - Id: ${payload.id}`, { time: new Date().toISOString() });

    const pdfDocs = await loadPdf.triggerAndWait(payload.id, {
      idempotencyKey: `load-pdf-${payload.jobId}-${payload.id}`,
    });

    if (!pdfDocs.ok || !pdfDocs.output) {
      throw new Error(`PDF not found for metadata id: ${payload.id}`);
    }

    logger.info(`PDF file loaded successfully! Length: ${pdfDocs.output.doc.length}, jobId: ${payload.jobId}`, {
      time: new Date().toISOString(),
    });

    await generateEmbedding.trigger(
      { itemId: payload.id, doc: pdfDocs.output.doc, jobId: payload.jobId },
      { idempotencyKey: `generate-metadata-embedding-${payload.jobId}-${payload.id}` }
    );

    logger.info(`Add Embeddings - Done`, { time: new Date().toISOString() });

    return { id: payload.id };
  },
  handleError: async (payload, error) => {
    logger.error(`Error generating embeddings: ${(error as Error).message}, id: ${payload.id}`, {
      time: new Date().toISOString(),
    });
  },
});
