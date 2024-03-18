import { IO } from '@trigger.dev/sdk';

import * as articleService from '@/lib/article-metadata/metadata.server';
import { getSummaryByDocuments } from '@/lib/langchain/summarization.server';

export const generateSummary = async (cacheKey: string, io: IO, itemId: string, pdfJson: string) => {
  const generatedSummary = await io.runTask(`${cacheKey}-generate-summary`, async (task) => {
    const pdfDocs = JSON.parse(pdfJson).doc;

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
    await articleService.addGeneratedSummary(itemId, generatedSummary);

    await io.logger.info(`Generate AI Content - Added`, {
      time: new Date().toISOString(),
    });

    return task;
  });

  await io.logger.info(`Generate AI Content - Done`, {
    time: new Date().toISOString(),
  });

  return { itemId };
};
