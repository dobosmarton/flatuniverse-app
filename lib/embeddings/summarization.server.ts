'use server';

import type { BaseNode } from '@llamaindex/edge';
import { SummaryIndex, SummaryRetrieverMode } from '@llamaindex/edge/indices/summary/index';
import * as logger from '../logger';

export const getSummaryByDocuments = async (nodes: BaseNode[]): Promise<string | null> => {
  try {
    const index = await SummaryIndex.init({ nodes });

    const queryEngine = index.asQueryEngine({
      retriever: index.asRetriever({ mode: SummaryRetrieverMode.LLM }),
    });

    const response = await queryEngine.query({ query: 'Write a concise summary of the content.' });

    logger.log('Summarization chain was invoked! 💰');

    const content = response.toString();

    if (!content) {
      logger.log('No text in response!');
      return null;
    }

    return content;
  } catch (error) {
    logger.error('Error in summarization chain:', error);
    throw error;
  }
};
