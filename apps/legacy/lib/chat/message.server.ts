'use server';

import { article_metadata, chat_message } from '@prisma/client';
import { prismaClient } from '../prisma';

export const create = async (
  threadSlug: string,
  message: Pick<chat_message, 'role' | 'content'> & {
    suggestions: article_metadata[];
  }
) => {
  return prismaClient.chat_message.create({
    data: {
      content: message.content,
      role: message.role,
      chat_thread: {
        connect: {
          slug: threadSlug,
        },
      },
    },
  });
};
