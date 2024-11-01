import { chat_message } from '@prisma/client';
import { Metadata, MetadataMode } from 'llamaindex';
import { getIndexFromStore } from '../vector-store';

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
  prompt: string
): Promise<DocumentSuggestion[]> => {
  try {
    const index = await getIndexFromStore();
    // Create hybrid query
    const hybridQuery = createHybridQuery(prompt, chatHistory);

    // Create retriever with custom configuration
    const retriever = index.asRetriever({
      similarityTopK: 5,
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

    // Sort by score
    return enhancedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
  } catch (error) {
    console.error('Error finding relevant documents:', error);
    throw error;
  }
};
