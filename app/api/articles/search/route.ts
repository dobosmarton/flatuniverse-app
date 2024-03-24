import { NextRouteFunction } from '@/lib/route-validator.server';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import * as logger from '@/lib/logger';
import { articleMetadataSearchSchema } from './schema';

const searchArticles: NextRouteFunction<{}> = async (request) => {
  const searchParams = request.nextUrl.searchParams;
  const groups = searchParams.get('groups');
  const categories = searchParams.get('categories');
  const search = searchParams.get('search');
  const page = searchParams.get('page');
  const pageSize = searchParams.get('pageSize');

  const parsedParams = articleMetadataSearchSchema.parse({
    groups,
    categories,
    search,
    page,
    pageSize,
  });

  logger.log('New search request', parsedParams);

  const products = await articleMetadataService.searchArticleMetadata(parsedParams);

  return Response.json({ data: products });
};

export const GET = searchArticles;
