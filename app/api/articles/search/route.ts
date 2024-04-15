import { NextRouteFunction } from '@/lib/route-validator.server';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import * as articleMetadataSchema from '@/lib/article-metadata/schema';
import * as logger from '@/lib/logger';

const searchArticles: NextRouteFunction<{}> = async (request) => {
  const searchParams = request.nextUrl.searchParams;
  const groups = searchParams.get('groups');
  const categories = searchParams.get('categories');
  const authors = searchParams.get('authors');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const search = searchParams.get('search');
  const page = searchParams.get('page');
  const pageSize = searchParams.get('pageSize');

  const parsedParams = articleMetadataSchema.articleMetadataSearchSchema.parse({
    groups,
    categories,
    authors,
    from,
    to,
    search,
    page,
    pageSize,
  });

  logger.log('New search request', parsedParams);

  const products = await articleMetadataService.searchArticleMetadata(parsedParams);

  return Response.json({ data: products });
};

export const GET = searchArticles;
