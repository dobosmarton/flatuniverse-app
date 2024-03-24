'use server';

import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { ArticleMetadataSearch } from '@/app/api/articles/search/schema';
import * as logger from '@/lib/logger';
import { prismaClient } from '../prisma';
import { slugify } from '../utils';
import { Metadata } from '../oai-pmh/schema';

export const addArticleMetadata = async (entries: Metadata[]): Promise<void> => {
  logger.log('   ');
  logger.log('-------------------------------------------------');
  logger.log('Adding metadata', entries.length, ' start: ', new Date().toISOString());
  const data = entries.map((entry) => ({
    ...entry,
    externalId: entry.id,
    id: randomUUID(),
    authors: entry.authors.map((author) => ({
      ...author,
      id: randomUUID(),
    })),
    categories: entry.categories.map((category) => ({
      ...category,
      id: randomUUID(),
    })),
    links: entry.links.map((link) => ({
      ...link,
      id: randomUUID(),
    })),
  }));

  const authors = data.flatMap<Prisma.authorCreateManyInput>((entry) => entry.authors);

  const categories = data
    .flatMap((entry) => entry.categories)
    .map<Prisma.categoryCreateManyInput>((category) => ({
      id: category.id,
      short_name: category.shortName,
      full_name: category.fullName,
      group_name: category.groupName,
    }));

  const links = data.flatMap<Prisma.linkCreateManyInput>((entry) => entry.links);

  logger.log('Adding metadata start transaction', new Date().toISOString());

  await prismaClient.$transaction(
    async (tx) => {
      const authorCount = await tx.author.createMany({
        data: authors,
        skipDuplicates: true,
      });

      const existingAuthors = await tx.author.findMany({
        where: { name: { in: authors.map((author) => author.name) } },
        select: { id: true, name: true },
      });

      logger.log('Authors count', authors.length, authorCount.count, existingAuthors.length, new Date().toISOString());

      const categoryCount = await tx.category.createMany({
        data: categories,
        skipDuplicates: true,
      });

      const existingCategories = await tx.category.findMany({
        where: { short_name: { in: categories.map((category) => category.short_name) } },
        select: { id: true, short_name: true },
      });

      logger.log(
        'Categories count',
        categories.length,
        categoryCount.count,
        existingCategories.length,
        new Date().toISOString()
      );

      const linkCount = await tx.link.createMany({
        data: links,
        skipDuplicates: true,
      });

      const existingLinks = await tx.link.findMany({
        where: { href: { in: links.map((link) => link.href) } },
        select: { id: true, href: true },
      });

      logger.log('Links count mismatch', links.length, linkCount.count, existingLinks.length, new Date().toISOString());

      const metadataCount = await tx.article_metadata.createMany({
        data: data.map<Prisma.article_metadataCreateManyInput>((entry) => ({
          id: entry.id,
          external_id: entry.externalId,
          title: entry.title,
          abstract: entry.abstract,
          published: entry.published,
          updated: entry.updated || entry.published,
          comment: entry.comment,
          slug: slugify(entry.title),
        })),
        skipDuplicates: true,
      });

      logger.log('Metadata count mismatch', metadataCount.count, data.length, new Date().toISOString());

      const existingMetadata = await tx.article_metadata.findMany({
        where: { external_id: { in: data.map((entry) => entry.externalId) } },
        select: { id: true, external_id: true },
      });

      const connectedFileds = data.reduce<{
        authors: Prisma.article_metadata_to_authorCreateManyInput[];
        links: Prisma.article_metadata_to_linkCreateManyInput[];
        categories: Prisma.article_metadata_to_categoryCreateManyInput[];
      }>(
        (acc, entry) => {
          const savedMetadata = existingMetadata.find(
            (existingMetadata) => existingMetadata.external_id === entry.externalId
          );

          const authors = entry.authors.map<Prisma.article_metadata_to_authorCreateManyInput>((author) => {
            const savedAuthor = existingAuthors.find((existingAuthor) => existingAuthor.name === author.name);

            return {
              author_id: savedAuthor?.id ?? author.id,
              article_metadata_id: savedMetadata?.id ?? entry.id,
            };
          });

          const categories = entry.categories.map<Prisma.article_metadata_to_categoryCreateManyInput>((category) => {
            const savedCategory = existingCategories.find(
              (existingCategory) => existingCategory.short_name === category.shortName
            );

            return {
              category_id: savedCategory?.id ?? category.id,
              article_metadata_id: savedMetadata?.id ?? entry.id,
              primary: category.isPrimary,
            };
          });

          const links = entry.links.map<Prisma.article_metadata_to_linkCreateManyInput>((link) => {
            const savedLink = existingLinks.find((existingLink) => existingLink.href === link.href);
            return {
              link_id: savedLink?.id ?? link.id,
              article_metadata_id: savedMetadata?.id ?? entry.id,
            };
          });

          acc.authors.push(...authors);
          acc.categories.push(...categories);
          acc.links.push(...links);

          return acc;
        },
        { authors: [], links: [], categories: [] }
      );

      logger.log(
        'Metadata count after filtering',
        connectedFileds.authors.length,
        connectedFileds.categories.length,
        connectedFileds.links.length,
        new Date().toISOString()
      );

      await tx.article_metadata_to_author.createMany({
        data: connectedFileds.authors,
        skipDuplicates: true,
      });

      await tx.article_metadata_to_category.createMany({
        data: connectedFileds.categories,
        skipDuplicates: true,
      });

      await tx.article_metadata_to_link.createMany({
        data: connectedFileds.links,
        skipDuplicates: true,
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );

  logger.log('Adding metadata end transaction', new Date().toISOString());
  logger.log('-------------------------------------------------');
  logger.log('   ');
};

export const findLatestMetadataByExternalIds = async (params: { id: string; updated: Date }[]): Promise<string[]> => {
  const savedRecords = await prismaClient.article_metadata.findMany({
    where: { external_id: { in: params.map((param) => param.id) } },
    select: { external_id: true, updated: true },
  });

  return savedRecords
    .filter((saved) => {
      const param = params.find((param) => param.id === saved.external_id);
      return param && saved.updated <= param.updated;
    })
    .map((item) => item.external_id);
};

export const addNewArticleMetadata = async (metadataEntries: Metadata[]) => {
  try {
    const existingIds = await findLatestMetadataByExternalIds(metadataEntries);

    if (existingIds.length === metadataEntries.length) {
      return null;
    }

    const filteredMetadata = metadataEntries.filter((entry) => !existingIds.includes(entry.id));

    const uniqueFilteredMetadata = filteredMetadata.filter(
      (metadata, index, self) => index === self.findIndex((m) => m.id === metadata.id)
    );

    await addArticleMetadata(uniqueFilteredMetadata);
  } catch (error) {
    logger.log('Error adding new metadata', error);
    throw error;
  }
};

export const addGeneratedSummary = async (id: string, summary: string) => {
  const metadata = await prismaClient.article_metadata.update({
    where: { id },
    data: { generated_summary: summary },
  });

  return metadata;
};

export const getGeneratedSummary = async (id: string) => {
  const metadata = await prismaClient.article_metadata.findUnique({
    where: { id },
    select: { id: true, generated_summary: true },
  });

  return metadata;
};

export const getArticleMetadataList = async (page = 0, pageSize = 10) => {
  const articles = await prismaClient.article_metadata.findMany({
    take: pageSize,
    skip: page && pageSize ? page * pageSize : undefined,
    orderBy: [{ published: 'desc' }, { external_id: 'desc' }],
    include: {
      authors: { select: { author: { select: { name: true } } } },
      categories: {
        select: { category: { select: { short_name: true, full_name: true, group_name: true } } },
      },
      links: { select: { link: { select: { href: true, rel: true, type: true, title: true } } } },
    },
  });

  return articles;
};

export const getArticleMetadataBySlug = async (slug: string) => {
  const article = await prismaClient.article_metadata.findFirst({
    where: { slug },
    include: {
      authors: { select: { author: { select: { name: true } } } },
      categories: {
        select: { category: { select: { short_name: true, full_name: true, group_name: true } } },
      },
      links: { select: { link: { select: { href: true, rel: true, type: true, title: true } } } },
    },
  });

  return article;
};

export const getArticleMetadataIdsWithZeroEmbeddingsByIds = async (externalIds: string[]) => {
  const articles = await prismaClient.article_metadata.findMany({
    where: { external_id: { in: externalIds }, embeddings: { none: {} } },
    select: { id: true, external_id: true },
  });

  return articles;
};

export const getArticleMetadataIdsWithZeroEmbeddings = async (page = 0, pageSize = 10) => {
  const articles = await prismaClient.article_metadata.findMany({
    where: { embeddings: { none: {} } },
    take: pageSize,
    skip: page && pageSize ? page * pageSize : undefined,
    orderBy: [{ published: 'desc' }, { external_id: 'desc' }],
    select: { id: true, external_id: true },
  });

  return articles;
};

export const getArticlePdfLink = async (id: string): Promise<string | undefined> => {
  const article = await prismaClient.article_metadata.findUnique({
    where: { id },
    include: { links: { select: { link: { select: { href: true, type: true } } } } },
  });

  return article?.links.find((connection) => connection.link.type === 'application/pdf')?.link.href;
};

/**
 * Searches for article metadata based on the provided parameters.
 * Category filtering is done using the `categoryGroups` and `categories` parameters.
 * If `categoryGroups` is provided, only categories from those groups are considered.
 * If both are provided, categories with matching short names,
 * and categories with matching group names, only if the group doesnt have category filter, are considered.
 * If neither are provided, all categories are considered.
 *
 * @param params - The search parameters.
 * @returns A promise that resolves to an array of article metadata.
 */
export const searchArticleMetadata = async (params: ArticleMetadataSearch) => {
  const { categoryGroups, categories, search, page, pageSize } = params;

  // Get group names for the filter categories
  const groupWithCategories = categories
    ? await prismaClient.category.findMany({
        where: { group_name: { in: categoryGroups }, short_name: { in: categories } },
        select: { group_name: true },
      })
    : [];

  const groupNamesWithCategories = groupWithCategories.map((group) => group.group_name);

  const articles = await prismaClient.article_metadata.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { abstract: { contains: search, mode: 'insensitive' } },
                { authors: { some: { author: { name: { contains: search, mode: 'insensitive' } } } } },
                { categories: { some: { category: { short_name: { contains: search, mode: 'insensitive' } } } } },
              ],
            }
          : {},
        categoryGroups || categories
          ? {
              categories: {
                some: {
                  category: {
                    OR: [
                      { group_name: { notIn: groupNamesWithCategories, in: categoryGroups } },
                      { group_name: { in: groupNamesWithCategories }, short_name: { in: categories } },
                    ],
                  },
                },
              },
            }
          : {},
      ],
    },
    take: pageSize,
    skip: page && pageSize ? page * pageSize : undefined,
    orderBy: [{ published: 'desc' }, { external_id: 'desc' }],
    include: {
      authors: { select: { author: { select: { name: true } } } },
      categories: {
        select: { category: { select: { short_name: true, full_name: true, group_name: true } } },
      },
      links: { select: { link: { select: { href: true, rel: true, type: true, title: true } } } },
    },
  });

  return articles;
};

export type CreatedArticleMetadata = Prisma.PromiseReturnType<typeof addArticleMetadata>;
export type SearchArticleMetadata = Prisma.PromiseReturnType<typeof searchArticleMetadata>;
