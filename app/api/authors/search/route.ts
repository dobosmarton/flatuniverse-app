import { NextRouteFunction } from '@/lib/route-validator.server';
import * as authorService from '@/lib/authors';
import { authorSearchSchema } from './schema';

const searchAuthors: NextRouteFunction<{}> = async (request) => {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const page = searchParams.get('page');
  const pageSize = searchParams.get('pageSize');

  const parsedParams = authorSearchSchema.parse({
    search,
    page,
    pageSize,
  });

  const authors = await authorService.sarchAuthorsByName(parsedParams);

  return Response.json({ data: authors });
};

export const GET = searchAuthors;
