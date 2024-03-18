import { IO } from '@trigger.dev/sdk';

import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import * as articleService from '@/lib/article-metadata/metadata.server';
import { loadPDF } from '@/lib/langchain/file-reader.server';
import { addNewEmbeddings } from '@/lib/langchain/embeddings.server';
import { getSummaryByDocuments } from '@/lib/langchain/summarization.server';

export const generateContent = async (
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

  await io.runTask(`${cacheKey}-add-embeddings`, async (task) => {
    await io.logger.info(`Add Embeddings - Index: ${item.id}`, {
      time: new Date().toISOString(),
    });

    const pdfDocs = JSON.parse(pdfJsonData).doc;

    await addNewEmbeddings(pdfDocs);

    await io.logger.info(`Add Embeddings - Done`, {
      time: new Date().toISOString(),
    });

    return task;
  });

  const generatedSummary = await io.runTask(`${cacheKey}-generate-summary`, async (task) => {
    const pdfDocs = JSON.parse(pdfJsonData).doc;

    const summary = await getSummaryByDocuments(pdfDocs);

    await io.logger.info(`Summary generated successfully! Length: ${summary?.length}`, {
      time: new Date().toISOString(),
    });

    return summary;
  });

  if (!generatedSummary) {
    await io.logger.info(`Summary not generated`, {
      time: new Date().toISOString(),
    });
    return;
  }

  await io.runTask(`${cacheKey}-add-summary`, async (task) => {
    await articleService.addGeneratedSummary(item.id, generatedSummary);

    await io.logger.info(`Generate AI Content - Added`, {
      time: new Date().toISOString(),
    });

    return task;
  });

  await io.logger.info(`Generate AI Content - Done`, {
    time: new Date().toISOString(),
  });

  return { item };
};
