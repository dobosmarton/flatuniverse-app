import { IO } from '@trigger.dev/sdk';

import { addNewEmbeddings } from '@/lib/langchain/embeddings.server';

export const generateEmbedding = async (cacheKey: string, io: IO, itemId: string, pdfJson: string) => {
  await io.runTask(`${cacheKey}-add-embeddings`, async (task) => {
    await io.logger.info(`Add Embeddings - Index: ${itemId}`, {
      time: new Date().toISOString(),
    });

    const pdfDocs = JSON.parse(pdfJson).doc;

    await addNewEmbeddings(itemId, pdfDocs);

    await io.logger.info(`Add Embeddings - Done`, {
      time: new Date().toISOString(),
    });

    return task;
  });

  return { itemId };
};
