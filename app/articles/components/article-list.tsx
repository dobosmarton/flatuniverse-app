'use client';

import React from 'react';
import useSWRInfinite, { SWRInfiniteKeyLoader } from 'swr/infinite';
import { DateRange } from 'react-day-picker';
import { ArticleMetadataCardContainer } from '@/components/article-metadata/card-container';
import { useBoundStore } from '@/stores';
import { useDebounce } from '@/hooks/useDebounce';
import { fetcher } from '@/lib/api-client/fetch';
import { article_metadata } from '@prisma/client';
import { Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';

type Article = article_metadata & {
  published: string | Date;
  authors: { author: { name: string } }[];
  categories: { category: { short_name: string; full_name: string; group_name: string } }[];
  links: { link: { title: string | null; href: string; type: string | null } }[];
};

type Props = {
  initialArticles: Article[];
  categoryTree: {
    [groupName: string]: { key: string; value: string }[];
  };
};

const PAGE_SIZE = 10;

const constructQueryParams = (
  searchTerm: string,
  categoryGroups: string[] | undefined,
  categories: string[] | undefined,
  authors: string[] | undefined,
  date: DateRange | undefined,
  page = 0,
  pageSize = PAGE_SIZE
) => {
  const params: Record<string, string> = {
    page: page.toString(),
    pageSize: pageSize.toString(),
  };
  if (categoryGroups) {
    params.groups = categoryGroups.join(',');
  }
  if (categories) {
    params.categories = categories.join(',');
  }
  if (authors) {
    params.authors = authors.join(',');
  }
  if (date?.from) {
    params.from = date.from.toDateString();
  }
  if (date?.to) {
    params.to = date.to.toDateString();
  }
  if (searchTerm) {
    params.search = searchTerm;
  }

  return new URLSearchParams(params);
};

export const ArticleList: React.FC<Props> = ({ initialArticles, categoryTree }) => {
  const { categoryGroups, categories, date, searchTerm, authors } = useBoundStore();

  const debouncedCategoryGroups = useDebounce(categoryGroups, 200);
  const debouncedCategories = useDebounce(categories, 200);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const debouncedAuthors = useDebounce(authors, 200);
  const debouncedDate = useDebounce(date, 200);

  const getKey: SWRInfiniteKeyLoader<Article[], string | null> = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.length) return null; // reached the end
    return (
      '/api/articles/search?' +
      constructQueryParams(
        debouncedSearchTerm,
        debouncedCategoryGroups,
        debouncedCategories,
        debouncedAuthors,
        debouncedDate,
        pageIndex
      )
    );
  };

  const {
    data: articleMetadataList,
    isLoading,
    size,
    setSize,
  } = useSWRInfinite(getKey, (url) => fetcher<Article[]>(url), {
    keepPreviousData: true,
    fallbackData: [initialArticles],
    revalidateOnMount: false,
    revalidateOnFocus: false,
  });

  // Client side filtering
  // This is to prevent the UI from flickering when the user changes the filters
  // The server side filtering is still necessary to prevent the client from fetching all the articles
  const clientSideFilteredArticles = isLoading
    ? articleMetadataList?.map((item) =>
        item?.filter((article) => {
          if (debouncedCategoryGroups || debouncedCategories) {
            return article.categories.some(
              (connection) =>
                debouncedCategoryGroups?.includes(connection.category.group_name) &&
                (!debouncedCategories ||
                  debouncedCategories.includes(connection.category.short_name) ||
                  categoryTree[connection.category.group_name].every(
                    (category) => !debouncedCategories.includes(category.key)
                  ))
            );
          }

          return true;
        })
      )
    : null;

  const articleList = clientSideFilteredArticles ?? articleMetadataList;

  const isLoadingMore =
    (isLoading && size === 0) ||
    (size > 0 && articleMetadataList && typeof articleMetadataList[size - 1] === 'undefined');
  const isEmpty = articleMetadataList?.[0]?.length === 0;
  const isReachingEnd =
    isEmpty || (articleMetadataList && (articleMetadataList[articleMetadataList.length - 1]?.length ?? 0) < PAGE_SIZE);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col gap-2 items-center">
        <div
          className={cn('flex justify-center items-center transition-all ease-in-out duration-300', {
            'opacity-0 h-0': !isLoading,
            'opacity-100 h-[32px]': isLoading,
          })}>
          <Loader2Icon width={24} height={24} className={cn('animate-spin ')} />
        </div>

        {articleList?.flatMap((articles) =>
          articles?.map((article) => <ArticleMetadataCardContainer key={article.id} article={article} />)
        )}

        <div className="flex justify-center items-center pt-6">
          {isLoadingMore ? <Loader2Icon width={24} height={24} className="animate-spin " /> : null}

          {!isLoadingMore && !isReachingEnd ? (
            <Button size={'sm'} variant={'outline'} className="gap-2" onClick={() => setSize(size + 1)}>
              <RefreshCwIcon size={16} /> Load more
            </Button>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
};
