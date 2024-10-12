import { logger, task } from '@trigger.dev/sdk/v3';

import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import * as fileHandlers from '@/lib/file-handlers';

export const loadPdf = task({
  id: 'load-pdf',
  retry: {
    maxAttempts: 3,
  },
  run: async (itemId: string) => {
    logger.info(`Load PDF - start: ${itemId}`, { time: new Date().toISOString() });

    const pdfLink = await articleMetadataService.getArticlePdfLink(itemId);

    if (!pdfLink) {
      logger.info(`PDF not found for metadata id: ${itemId}`, {
        time: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Load PDF - Index: ${itemId}`, { time: new Date().toISOString() });

    const pdfNodes = await fileHandlers.loadPDF(pdfLink, { metadata_id: itemId });

    logger.info(`PDF file loaded successfully! Length: ${pdfNodes.length}`, {
      time: new Date().toISOString(),
    });

    return { nodes: pdfNodes };
  },
});
