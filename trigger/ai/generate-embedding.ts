import { logger, task } from '@trigger.dev/sdk/v3';

import { addNewEmbeddings } from '@/lib/langchain/embeddings.server';

import { GenerateEmbeddingPayload } from '../schema/generate-embedding';

export const generateEmbedding = task({
  id: 'generate-embedding',
  run: async (payload: GenerateEmbeddingPayload) => {
    logger.info(`Add Embeddings - Index: ${payload.itemId}`, { time: new Date().toISOString() });

    await addNewEmbeddings(payload.itemId, payload.doc);

    logger.info(`Add Embeddings - Done`, { time: new Date().toISOString() });

    return { id: payload.itemId };
  },
});
