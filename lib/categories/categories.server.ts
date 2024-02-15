'use server';

import { Prisma, category } from '@prisma/client';
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

export type GetCategories = Prisma.PromiseReturnType<typeof getCategories>;
export type GetCategoryGroups = Prisma.PromiseReturnType<typeof getCategoryGroups>;
export type GetCategoriesByGroupNames = Prisma.PromiseReturnType<typeof getCategoriesByGroupNames>;
