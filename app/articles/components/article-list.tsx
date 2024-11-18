import React from 'react';

import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { ArticleMetadataSearch } from '@/lib/article-metadata/schema';
import { ArticleMetadataCardContainer } from '@/components/article-metadata/card-container';
import { TooltipProvider } from '@/components/ui/tooltip';

import { ArticleListPagination } from './article-list-pagination';

type Props = {
  searchParams: ArticleMetadataSearch;
};

export const ArticleList: React.FC<Props> = async ({ searchParams }) => {
  const { articles, totalCount } = await articleMetadataService.searchArticleMetadata({
    ...searchParams,
    // Next.js pages are 1-indexed, but the API is 0-indexed
    page: searchParams.page - 1,
  });

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col gap-2 items-center">
        {articles.map((article) => (
          <ArticleMetadataCardContainer key={article.id} article={article} />
        ))}

        <div className="flex pt-6 self-end">
          <ArticleListPagination searchParams={searchParams} totalCount={totalCount} pageSize={searchParams.pageSize} />
        </div>
      </div>
    </TooltipProvider>
  );
};
