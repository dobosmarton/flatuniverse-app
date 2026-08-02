import { NextRouteFunction } from '@/lib/route-validator.server';
import * as categoryService from '@/lib/categories/categories.server';

const getCategoriesByGroup: NextRouteFunction<{}> = async (request) => {
  const searchParams = request.nextUrl.searchParams;
  const groups = searchParams.get('groups');

  const groupNames = groups ? groups.split(',') : undefined;

  if (!groupNames) {
    const categoryGroups = await categoryService.getCategoryGroups();

    return Response.json({ data: categoryGroups });
  }

  const categories = await categoryService.getCategoriesByGroupNames(groupNames);

  return Response.json({ data: categories });
};

export const GET = getCategoriesByGroup;
