import { OpenAI } from '@langchain/openai';
import { ChainValues } from '@langchain/core/utils/types';
import { Document } from '@langchain/core/documents';
import { loadSummarizationChain } from 'langchain/chains';
import { PDFMetadata } from './types';

const model = new OpenAI({ temperature: 0 });

export const getSummaryByDocuments = async (docs: Document<PDFMetadata<{ metadata_id: string }>>[]) => {
  const chain = loadSummarizationChain(model, { type: 'map_reduce' });
  const res: ChainValues = await chain.invoke({
    input_documents: docs,
  });

  console.log('Summarization chain was invoked! 💰');

  if (!('text' in res)) {
    console.log('No text in response!');
    return res;
  }

  return res.text;
};
