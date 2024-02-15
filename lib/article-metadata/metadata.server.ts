'use server';

import { Prisma, article_metadata } from '@prisma/client';
import { prismaClient } from '../prisma';
import { ArticleMetadata, ArticleMetadataEntry } from './schema';
import { ArticleMetadataSearch } from '@/app/api/articles/search/schema';
import { slugify } from '../utils';

export const addArticleMetadata = async (entries: ArticleMetadata['entries']): Promise<article_metadata[]> => {
  let articleMetadataList: article_metadata[] = [];
  for await (const entry of entries) {
    console.log('Adding metadata', entry.id, ', ', articleMetadataList.length + 1, 'of', entries.length);
    const metadata = await prismaClient.article_metadata.create({
      data: {
        external_id: entry.id,
        title: entry.title,
        summary: entry.summary,
        published: entry.published,
        updated: entry.updated,
        comment: entry.comment,
        slug: slugify(entry.title),
        authors: {
          create: entry.authors.map<Prisma.article_metadata_to_authorCreateWithoutArticle_metadataInput>((author) => ({
            author: {
              connectOrCreate: {
                where: { name: author.name },
                create: {
                  name: author.name,
                },
              },
            },
          })),
        },
        categories: {
          create: entry.categories.map<Prisma.article_metadata_to_categoryCreateWithoutArticle_metadataInput>(
            (category) => ({
              primary: category.isPrimary,
              category: {
                connectOrCreate: {
                  where: { short_name: category.term },
                  create: {
                    short_name: category.term,
                    full_name: category.fullName,
                    group_name: category.groupName,
                  },
                },
              },
            })
          ),
        },
        links: {
          create: entry.links.map<Prisma.article_metadata_to_linkCreateWithoutArticle_metadataInput>((link) => ({
            link: {
              connectOrCreate: {
                where: { href: link.href },
                create: {
                  href: link.href,
                  rel: link.rel,
                  type: link.type,
                  title: link.title,
                },
              },
            },
          })),
        },
      },
    });

    articleMetadataList.push(metadata);
  }

  return articleMetadataList;
};

export const findLatestMetadataByExternalIds = async (params: { id: string; updated: Date }[]): Promise<string[]> => {
  const savedRecords = await prismaClient.article_metadata.findMany({
    where: { external_id: { in: params.map((param) => param.id) } },
    select: { external_id: true, updated: true },
  });

  return savedRecords
    .filter((saved) => {
      const param = params.find((param) => param.id === saved.external_id);
      return param && saved.updated >= param.updated;
    })
    .map((item) => item.external_id);
};

export const addNewArticleMetadata = async (metadataEntries: ArticleMetadataEntry[]) => {
  try {
    const existingIds = await findLatestMetadataByExternalIds(metadataEntries);

    if (existingIds.length === metadataEntries.length) {
      return null;
    }

    const filteredMetadata = metadataEntries.filter((entry) => !existingIds.includes(entry.id));

    return addArticleMetadata(filteredMetadata);
  } catch (error) {
    console.log('Error adding new metadata', error);
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

export const getLatestArticleMetadata = async () =>
  prismaClient.article_metadata.findFirst({
    orderBy: { updated: 'desc' },
  });

export const getArticleMetadataList = async (page = 0, pageSize = 10) => {
  const articles = await prismaClient.article_metadata.findMany({
    take: pageSize,
    skip: page && pageSize ? page * pageSize : undefined,
    orderBy: { updated: 'desc' },
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
                { title: { contains: search } },
                { summary: { contains: search } },
                { authors: { some: { author: { name: { contains: search } } } } },
                { categories: { some: { category: { short_name: { contains: search } } } } },
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
    orderBy: { updated: 'desc' },
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
