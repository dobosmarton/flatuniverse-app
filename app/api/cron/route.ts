import { NextRouteFunction } from '@/lib/route-validator.server';
import * as articleLoaderService from '@/lib/article-metadata/loader.server';
import type { GetCategoryGroups } from '@/lib/categories/categories.server';

const syncArticles: NextRouteFunction<{}, GetCategoryGroups> = async () => {
  await articleLoaderService.articleLoader();

  return Response.json({ status: 200 });
};

export const GET = syncArticles;
