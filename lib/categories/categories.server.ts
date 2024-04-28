'use server';

import { Prisma } from '@prisma/client';
import { prismaClient } from '../prisma';

type CategoryTree = {
  [groupName: string]: { key: string; value: string }[];
};

export const getCategories = async () => {
  return prismaClient.category.findMany({
    distinct: ['short_name'],
  });
};

export const getCategoryGroups = async () => {
  return prismaClient.category.findMany({
    distinct: ['group_name'],
  });
};

export const getCategoryTree = async (groupNames: string[]): Promise<CategoryTree> => {
  const categories = await prismaClient.category.findMany({
    distinct: ['short_name'],
    where: groupNames.length
      ? {
          group_name: {
            in: groupNames,
          },
        }
      : undefined,
  });

  return categories.reduce<CategoryTree>((acc, category) => {
    if (!acc[category.group_name]) {
      acc[category.group_name] = [];
    }

    acc[category.group_name].push({
      value: category.full_name,
      key: category.short_name,
    });

    return acc;
  }, {});
};

export const getCategoriesByGroupNames = async (groupName: string[]) => {
  return prismaClient.category.findMany({
    where: {
      group_name: { in: groupName },
    },
    distinct: ['short_name'],
  });
};

export const getCategoriesGroupedByNames = async (startDate = new Date(), page = 0, pageSize = 10) => {
  return prismaClient.category.findMany({
    distinct: ['group_name'],
    where: {
      article_metadata_list: { some: { article_metadata: { published: { gte: startDate } } } },
    },
    select: {
      group_name: true,
      article_metadata_list: {
        where: { article_metadata: { published: { gte: startDate } } },
        take: pageSize,
        skip: page && pageSize ? page * pageSize : undefined,
        select: {
          article_metadata: { select: { title: true, slug: true } },
        },
      },
    },
  });
};

export type GetCategories = Prisma.PromiseReturnType<typeof getCategories>;
export type GetCategoryGroups = Prisma.PromiseReturnType<typeof getCategoryGroups>;
export type GetCategoriesByGroupNames = Prisma.PromiseReturnType<typeof getCategoriesByGroupNames>;
