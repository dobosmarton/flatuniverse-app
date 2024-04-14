import React from 'react';
import { ArticleMetadataCardContainer } from '@/components/article-metadata/card-container';

import { ArticleMetadataSearch } from '@/lib/article-metadata/schema';
import { article_metadata } from '@prisma/client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArticleListPagination } from './article-list-pagination';

type Article = article_metadata & {
  published: string | Date;
  authors: { author: { name: string } }[];
  categories: { category: { short_name: string; full_name: string; group_name: string } }[];
  links: { link: { title: string | null; href: string; type: string | null } }[];
};

type Props = {
  articles: Article[];
  searchParams: ArticleMetadataSearch;
};

export const ArticleList: React.FC<Props> = ({ articles, searchParams }) => {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col gap-2 items-center">
        {articles?.map((article) => (
          <ArticleMetadataCardContainer key={article.id} article={article} />
        ))}

        <div className="flex pt-6 self-end">
          <ArticleListPagination searchParams={searchParams} hasNextPage={!!articles?.length} />
        </div>
      </div>
    </TooltipProvider>
  );
};
