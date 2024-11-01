'use server';

import { ChatMessage, ContextChatEngine, EngineResponse, MessageType } from 'llamaindex';
import { getMessagesByThreadSlug, getThreads } from './thread.server';
import { article_metadata, chat_message, chat_message_role, chat_thread } from '@prisma/client';
import { getIndexFromStore } from '../vector-store';
import { getArticleMetadataByIds } from '../article-metadata/metadata.server';
import { DocumentSuggestion, findRelevantDocuments } from './suggestion.server';
import type { ExtendedArticleMetadata } from '../article-metadata/metadata';

type ChatEngineProps = {
  chatHistory?: ChatMessage[];
};

export const getChatEngine = async ({ chatHistory }: ChatEngineProps): Promise<ContextChatEngine> => {
  const index = await getIndexFromStore();

  const retriever = index.asRetriever({
    similarityTopK: 5,
  });

  const chatEngine = new ContextChatEngine({ retriever, chatHistory });

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

const getPromptTemplate = (prompt: string) => {
  return `
  You are a research assistant.

  ${prompt}
  `;
};

export const getMetadataIdsFromChatResponse = async (response: DocumentSuggestion[]): Promise<string[]> => {
  return response
    .map((node) => node.metadata.metadataId || node.metadata.metadata_id)
    .filter((id) => typeof id === 'string');
};

const getChatResponse = async (
  messages: chat_message[],
  prompt: string,
  withHistory: boolean = true
): Promise<AsyncIterable<EngineResponse>> => {
  const chatEngine = await getChatEngine({
    chatHistory: withHistory ? getChatHistoryMessages(messages) : undefined,
  });

  const chatResponse = await chatEngine.chat({
    message: getPromptTemplate(prompt),
    stream: true,
  });

  return chatResponse;
};

export const chatCompletion = async (
  messages: chat_message[],
  prompt: string,
  withHistory: boolean = true
): Promise<AsyncIterable<EngineResponse>> => {
  return getChatResponse(messages, prompt, withHistory);
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
  prompt: string
): Promise<ExtendedArticleMetadata[]> => {
  const documents = await findRelevantDocuments(messages, prompt);

  const metadataIds = await getMetadataIdsFromChatResponse(documents);

  const articleMetadataList = await getArticleMetadataByIds(metadataIds);

  return articleMetadataList;
};

export const getChatHistory = async (): Promise<chat_thread[]> => {
  const history = await getThreads();

  return history ?? [];
};
