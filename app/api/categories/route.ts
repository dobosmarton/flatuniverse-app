import { NextRouteFunction } from '@/lib/route-validator.server';
import * as categoryService from '@/lib/categories/categories.server';
import type { GetCategoryGroups } from '@/lib/categories/categories.server';

const getCategoryGroups: NextRouteFunction<{}, GetCategoryGroups> = async () => {
  const categoryGroups = await categoryService.getCategoryGroups();

  return Response.json({ data: categoryGroups }, { status: 200 });
};

export const GET = getCategoryGroups;
