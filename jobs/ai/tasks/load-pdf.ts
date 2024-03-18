import { IO } from '@trigger.dev/sdk';

import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { loadPDF } from '@/lib/langchain/file-reader.server';

export const loadPdf = async (
  cacheKey: string,
  io: IO,
  item: {
    id: string;
    external_id: string;
  }
) => {
  const pdfLink = await io.runTask(`${cacheKey}-get-article-pdf`, async () => {
    await io.logger.info(`Generate AI Content - Id: ${item.id}`, {
      time: new Date().toISOString(),
    });

    return await articleMetadataService.getArticlePdfLink(item.id);
  });

  if (!pdfLink) {
    await io.logger.info(`PDF not found for metadata id: ${item.id}`, {
      time: new Date().toISOString(),
    });
    return;
  }

  const pdfJsonData = await io.runTask(`${cacheKey}-load-pdf`, async () => {
    await io.logger.info(`Load PDF - Index: ${item.id}`, {
      time: new Date().toISOString(),
    });

    const pdfDocs = await loadPDF(pdfLink, { metadata_id: item.id });

    await io.logger.info(`PDF file loaded successfully! Length: ${pdfDocs.length}`, {
      time: new Date().toISOString(),
    });

    // tasks can return JSON serializable data
    return JSON.stringify({ doc: pdfDocs });
  });

  return pdfJsonData;
};
