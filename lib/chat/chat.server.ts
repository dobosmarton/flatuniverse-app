'use server';

import { ChatMessage, EngineResponse, MessageType, OpenAI, SimpleChatEngine } from 'llamaindex';
import { getThreads } from './thread.server';
import { chat_message, chat_message_role, chat_thread } from '@prisma/client';
import { getArticleMetadataByIds } from '../article-metadata/metadata.server';
import { DocumentSuggestion, findRelevantDocuments } from './suggestion.server';
import type { ExtendedArticleMetadata } from '../article-metadata/metadata';
import { TemporalQueryAnalysis } from './query.server';

type ChatEngineProps = {
  chatHistory?: ChatMessage[];
};

export const getChatEngine = async ({ chatHistory }: ChatEngineProps): Promise<SimpleChatEngine> => {
  const chatEngine = new SimpleChatEngine({
    chatHistory,
    llm: new OpenAI({ model: 'gpt-4o-mini', temperature: 0.2 }),
  });

  return chatEngine;
};

const mapMessageRole = (role: chat_message_role): MessageType => {
  switch (role) {
    case 'USER':
      return 'user';
    case 'ASSISTANT':
      return 'assistant';
    default:
      return 'system';
  }
};

/* const mapChatResponseRole = (role: MessageType): chat_message_role => {
  switch (role) {
    case 'user':
      return 'USER';
    case 'assistant':
      return 'ASSISTANT';
    default:
      throw new Error('Invalid message role');
  }
}; */

const getChatHistoryMessages = (messages: chat_message[]): ChatMessage[] => {
  return messages.map<ChatMessage>((message) => ({
    role: mapMessageRole(message.role),
    content: message.content,
  }));
};

/**
 * Generates a prompt template for the chat engine by combining the user's question
 * with relevant document context.
 *
 * @param prompt - The user's question or prompt
 * @param relevantDocs - Array of relevant article metadata to use as context
 * @returns Formatted prompt string with context and instructions
 */
const getPromptTemplate = (prompt: string, relevantDocs: ExtendedArticleMetadata[]) => {
  const context = relevantDocs
    .map(
      (doc) =>
        `Title: ${doc.title}\nContent: ${doc.abstract}\nDate: ${doc.published.toISOString()}\nAuthors: ${doc.authors
          .map((author) => `${author.author.name}`)
          .join(', ')}`
    )
    .join('\n\n');

  const _prompt = `Answer the following question based on the provided context. 
    If the information in the context is not sufficient or relevant, say so.
    Use specific references and dates from the documents when applicable.
    Prioritize more recent information when available. The current date is ${new Date().toISOString()}.
    
    Context:
    ${context}
    
    Question: ${prompt}
    
    Answer:`;

  return _prompt;
};

export const getMetadataIdsFromChatResponse = async (response: DocumentSuggestion[]): Promise<string[]> => {
  return response
    .map((node) => node.metadata.metadataId || node.metadata.metadata_id)
    .filter((id) => typeof id === 'string');
};

/**
 * Gets a chat response from the LLM engine using the provided messages, prompt and relevant documents.
 *
 * @param messages - Array of previous chat messages in the conversation
 * @param prompt - The user's current question or prompt
 * @param withHistory - Whether to include chat history context, defaults to true
 * @param relevantDocs - Array of relevant article metadata to use as context, defaults to empty array
 * @returns Async iterable stream of engine responses
 */
const getChatResponse = async (
  messages: chat_message[],
  prompt: string,
  withHistory: boolean = true,
  relevantDocs: ExtendedArticleMetadata[] = []
): Promise<AsyncIterable<EngineResponse>> => {
  const chatEngine = await getChatEngine({
    chatHistory: withHistory ? getChatHistoryMessages(messages) : undefined,
  });

  const chatResponse = await chatEngine.chat({
    message: getPromptTemplate(prompt, relevantDocs),
    stream: true,
  });

  return chatResponse;
};

export const chatCompletion = async (
  messages: chat_message[],
  prompt: string,
  withHistory: boolean = true,
  relevantDocs: ExtendedArticleMetadata[] = []
): Promise<AsyncIterable<EngineResponse>> => {
  return getChatResponse(messages, prompt, withHistory, relevantDocs);
};

/* export const chatResponseToMessage = async (
  response: EngineResponse
): Promise<
  Pick<chat_message, 'role' | 'content'> & {
    suggestions: article_metadata[];
  }
> => {
  const metadataIds = await getMetadataIdsFromChatResponse(response);
  const articleMetadataList = await getArticleMetadataByIds(metadataIds);

  return {
    role: mapChatResponseRole(response.message.role),
    content: response.message.content as string,
    suggestions: articleMetadataList,
  };
}; */

export const getDocumentSuggestions = async (
  messages: chat_message[],
  prompt: string,
  temporalAnalysis: TemporalQueryAnalysis
): Promise<ExtendedArticleMetadata[]> => {
  const documents = await findRelevantDocuments(messages, prompt, temporalAnalysis);

  const metadataIds = await getMetadataIdsFromChatResponse(documents);

  const articleMetadataList = await getArticleMetadataByIds(metadataIds);

  return articleMetadataList;
};

export const getChatHistory = async ({ limit }: { limit?: number } = {}): Promise<chat_thread[]> => {
  const history = await getThreads({ limit });

  return history ?? [];
};
