import { chat_message } from '@prisma/client';
import { Metadata, MetadataMode } from 'llamaindex';
import { FilterOperator, FilterCondition } from 'llamaindex/vector-store/types';
import { getIndexFromStore } from '../vector-store';
import type { TemporalQueryAnalysis } from './query.server';
import { rankTemporalDocuments } from './ranking.server';

export type DocumentSuggestion = {
  id: string;
  score: number;
  content: string;
  metadata: Metadata;
};

const prepareChatHistory = (chatHistory: chat_message[]): Pick<chat_message, 'role' | 'content'>[] => {
  if (!chatHistory || chatHistory.length === 0) return [];

  // Take recent messages based on context window
  const contextWindow = process.env.CONTEXT_WINDOW ?? 5;

  const recentMessages = chatHistory.slice(-contextWindow);

  return recentMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};

export const createHybridQuery = (prompt: string, chatHistory: chat_message[]): string => {
  const contextMessages = prepareChatHistory(chatHistory);

  if (contextMessages.length === 0) return prompt;

  // Combine recent context with current prompt
  const contextString = contextMessages.map((msg) => msg.content).join(' ');

  return `${prompt} ${contextString}`;
};

export const findRelevantDocuments = async (
  chatHistory: chat_message[],
  prompt: string,
  temporalAnalysis: TemporalQueryAnalysis,
  topK: number = 5
): Promise<DocumentSuggestion[]> => {
  try {
    const index = await getIndexFromStore();
    // Create hybrid query
    const hybridQuery = createHybridQuery(prompt, chatHistory);

    // If the query is temporal, increase the topK to 2x the initial value
    const initialTopK = temporalAnalysis.isTemporalQuery ? topK * 2 : topK;

    // Create retriever with custom configuration
    const retriever = index.asRetriever({
      similarityTopK: initialTopK,
      // If the query is temporal, add filters to the retriever
      filters:
        temporalAnalysis.isTemporalQuery && temporalAnalysis.timeFrame
          ? {
              filters: [
                {
                  key: 'timestamp',
                  value: temporalAnalysis.timeFrame.start.getTime(),
                  operator: FilterOperator.GTE,
                },
                {
                  key: 'timestamp',
                  value: temporalAnalysis.timeFrame.end.getTime(),
                  operator: FilterOperator.LTE,
                },
              ],
              condition: FilterCondition.AND,
            }
          : undefined,
    });

    // Retrieve nodes
    const retrievedNodes = await retriever.retrieve(hybridQuery);

    // Process and enhance results
    const enhancedResults = retrievedNodes.map<DocumentSuggestion>(({ node, score }) => ({
      id: node.id_,
      score: score ?? 0,
      content: node.getContent(MetadataMode.NONE),
      metadata: node.metadata,
    }));

    if (temporalAnalysis.isTemporalQuery) {
      const rankedResults = await rankTemporalDocuments(enhancedResults, temporalAnalysis, topK);
      return rankedResults;
    }

    // Sort by score
    return enhancedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
  } catch (error) {
    console.error('Error finding relevant documents:', error);
    throw error;
  }
};
