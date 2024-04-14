import React from 'react';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { ArticleMetadataSearch } from '@/lib/article-metadata/schema';
import { ArticleList } from './article-list';

type Props = {
  searchParams: ArticleMetadataSearch;
};

export const ArticleListLoader: React.FC<Props> = async ({ searchParams }) => {
  const articleList = await articleMetadataService.searchArticleMetadata({
    ...searchParams,
    // Next.js pages are 1-indexed, but the API is 0-indexed
    page: searchParams.page - 1,
  });

  return <ArticleList articles={articleList} searchParams={searchParams} />;
};
