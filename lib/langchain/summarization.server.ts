import { loadSummarizationChain } from 'langchain/chains';
import { OpenAI } from '@langchain/openai';
import { ChainValues } from '@langchain/core/utils/types';
import { Document } from '@langchain/core/documents';
import * as logger from '../logger';
import { PDFMetadata } from './types';

const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo-1106' });

const hasText = (res: ChainValues): res is { text: string } => 'text' in res;

export const getSummaryByDocuments = async (docs: Document<PDFMetadata<{ metadata_id: string }>>[]) => {
  try {
    const chain = loadSummarizationChain(model, { type: 'map_reduce' });

    const res: ChainValues = await chain.invoke({
      input_documents: docs,
    });

    logger.log('Summarization chain was invoked! 💰');

    if (!hasText(res)) {
      logger.log('No text in response!');
      return null;
    }

    return res.text;
  } catch (error) {
    logger.error('Error in summarization chain:', error);
    throw error;
  }
};
