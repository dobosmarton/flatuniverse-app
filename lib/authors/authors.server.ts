'use server';

import { author } from '@prisma/client';
import { prismaClient } from '../prisma';
import * as redis from '../redis';
import * as pagiantion from '../pagination';
import * as validators from '../validators';
import { AuthorsByArticleInput, authorsByArticleInputSchema, SearchInput } from './schema';

export type Author = Pick<author, 'id' | 'name'> & { count: number };

const searchAuthorsByNameFn = async ({ page, pageSize, search }: AuthorsByArticleInput): Promise<Author[]> => {
  const groupAuthors = await prismaClient.article_metadata_to_author.groupBy({
    by: ['author_id'],
    _count: {
      article_metadata_id: true,
    },
    orderBy: {
      _count: {
        article_metadata_id: 'desc',
      },
    },
    where: search
      ? {
          author: { name: { contains: search, mode: 'insensitive' } },
        }
      : undefined,
    take: pageSize,
    skip: page && pageSize ? page * pageSize : undefined,
  });

  const authors = await prismaClient.author.findMany({
    where: { id: { in: groupAuthors.map((group) => group.author_id) } },
    select: { id: true, name: true },
  });

  return groupAuthors
    .map((group) => ({
      id: group.author_id,
      name: authors.find((author) => author.id === group.author_id)?.name,
      count: group._count.article_metadata_id,
    }))
    .filter((author): author is Author => Boolean(author.name));
};

const cacheSearchAuthorsByName = redis.cacheableFunction<AuthorsByArticleInput, Author[]>(
  (props) => redis.keys.authorsByArticles(props.page, props.pageSize, props.search),
  redis.authorsByArticleCacheSchema,
  { ex: 60 },
  (_, props) => !!props.search
)(searchAuthorsByNameFn);

export const sarchAuthorsByName = validators.withInputValidator<
  pagiantion.PaginationInput & SearchInput,
  AuthorsByArticleInput,
  Author[]
>(authorsByArticleInputSchema)(cacheSearchAuthorsByName);
