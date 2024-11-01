'use server';

import { randomUUID } from 'crypto';
import { article_metadata, chat_message } from '@prisma/client';
import { prismaClient } from '../prisma';
import { slugify } from '../utils';

export const create = async (prompt: string) => {
  const slug = `${slugify(prompt.slice(0, 10))}-${randomUUID()}`;
  const thread = await prismaClient.chat_thread.create({
    data: {
      slug,
      chat_message: {
        create: {
          role: 'USER',
          content: prompt,
        },
      },
    },
  });

  return thread;
};

export const deleteThread = async (slug: string) => {
  const thread = await prismaClient.chat_thread.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!thread) {
    throw new Error('Thread not found!');
  }

  await prismaClient.$transaction([
    prismaClient.chat_thread_to_article_metadata.deleteMany({
      where: { chat_thread_id: thread.id },
    }),
    prismaClient.chat_message.deleteMany({
      where: { chat_thread_id: thread.id },
    }),
    prismaClient.chat_thread.delete({
      where: { id: thread.id },
    }),
  ]);
};

export const getThreads = async () => {
  return prismaClient.chat_thread.findMany({
    orderBy: {
      created_at: 'desc',
    },
  });
};

export const getMessagesByThreadSlug = async (slug: string) => {
  const thread = await prismaClient.chat_thread.findUnique({
    where: { slug },
    include: {
      chat_message: {
        orderBy: {
          created_at: 'asc',
        },
      },
      suggested_articles: {
        include: {
          article_metadata: true,
        },
      },
    },
  });

  if (!thread) {
    throw new Error('Thread not found!');
  }

  return thread;
};

export const createMessageWithSuggestions = async (
  threadSlug: string,
  message: Pick<chat_message, 'role' | 'content'> & {
    suggestions: article_metadata[];
  }
) => {
  await prismaClient.$transaction([
    prismaClient.chat_thread.update({
      where: { slug: threadSlug },
      data: {
        suggested_articles: { set: [] },
        chat_message: {
          create: {
            content: message.content,
            role: message.role,
          },
        },
      },
      include: {
        chat_message: {
          orderBy: {
            created_at: 'asc',
          },
        },
        suggested_articles: true,
      },
    }),
    prismaClient.chat_thread.update({
      where: { slug: threadSlug },
      data: {
        suggested_articles: {
          create: message.suggestions.map((suggestion) => ({
            article_metadata_id: suggestion.id,
          })),
        },
      },
    }),
  ]);

  return getMessagesByThreadSlug(threadSlug);
};
