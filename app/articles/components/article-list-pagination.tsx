'use client';

import { useEffect, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { ArticleMetadataSearch } from '@/lib/article-metadata/schema';
import { constructQueryParams } from '@/lib/query-params';

type Props = {
  searchParams: ArticleMetadataSearch;
  totalCount: number;
  pageSize: number | undefined;
};

export const ArticleListPagination: React.FC<Props> = ({ searchParams, totalCount, pageSize = 1 }) => {
  const [isPrevLoading, setIsPrevLoading] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState<number | null>(null);
  const pathname = usePathname();
  const page = searchParams.page ?? 1;

  useEffect(() => {
    setIsPrevLoading(false);
    setIsNextLoading(false);
    setLoadingPage(null);
  }, [searchParams]);

  const getNewPathname = (_page: number) => {
    const params = constructQueryParams({
      searchTerm: searchParams.search,
      categoryGroups: searchParams.categoryGroups,
      categories: searchParams.categories,
      authors: searchParams.authors,
      from: searchParams.from,
      to: searchParams.to,
      page: _page,
    });

    return `${pathname}?${params.toString()}`;
  };

  const renderPaginationItems = () => {
    const hasNextPage = page * pageSize < totalCount;
    const totalPages = Math.ceil(totalCount / pageSize);

    let paginationItems: JSX.Element[] = [];

    // We want to show 9 items in the pagination section
    // If the difference between the actual page and the total pages is less than 2,
    // we want to show 6 pages less than the total pages (we dont want to show the ... if we are close to the end)
    const minPage = page >= totalPages - 2 ? totalPages - 6 : page - 2;

    // If we are on the first 3 pages, we want to show 7 pages (we dont want to show the ... if we are close to the beginning)
    // 9 items in total
    const maxPage = page <= 3 ? 7 : page + 2;

    const isPrevDisabled = Boolean(page === 1 || isNextLoading || loadingPage);
    const isNextDisabled = Boolean(!hasNextPage || isPrevLoading || loadingPage);

    for (let i = Math.max(1, minPage); i <= Math.min(totalPages, maxPage); i++) {
      paginationItems.push(
        <PaginationItem key={i}>
          <PaginationLink href={getNewPathname(i)} isActive={i === page} onClick={() => setLoadingPage(i)}>
            {loadingPage === i ? <Loader2Icon width={16} height={16} className={'animate-spin w-20'} /> : i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (page > 3) {
      paginationItems.unshift(
        <PaginationLink href={getNewPathname(1)} key="link-first" onClick={() => setLoadingPage(1)}>
          {loadingPage === 1 ? <Loader2Icon width={16} height={16} className={'animate-spin w-20'} /> : 1}
        </PaginationLink>,
        <PaginationEllipsis key="ellipsis-first" />
      );
    }

    if (totalPages > 5 && page < totalPages - 2) {
      paginationItems.push(
        <PaginationEllipsis key="ellipsis-last" />,
        <PaginationLink href={getNewPathname(totalPages)} key="link-last" onClick={() => setLoadingPage(totalPages)}>
          {loadingPage === totalPages ? (
            <Loader2Icon width={16} height={16} className={'animate-spin w-20'} />
          ) : (
            totalPages
          )}
        </PaginationLink>
      );
    }

    return [
      <PaginationItem key="previous">
        {!isPrevLoading ? (
          <PaginationPrevious
            href={getNewPathname(page - 1)}
            className={isPrevDisabled ? 'pointer-events-none opacity-50' : ''}
            aria-disabled={isPrevDisabled}
            tabIndex={isPrevDisabled ? -1 : undefined}
            onClick={() => setIsPrevLoading(true)}
          />
        ) : (
          <Loader2Icon width={16} height={16} className={'animate-spin w-24'} />
        )}
      </PaginationItem>,

      ...paginationItems,

      <PaginationItem key="next">
        {!isNextLoading ? (
          <PaginationNext
            href={getNewPathname(page + 1)}
            className={isNextDisabled ? 'pointer-events-none opacity-50' : ''}
            aria-disabled={isNextDisabled}
            tabIndex={isNextDisabled ? -1 : undefined}
            onClick={() => setIsNextLoading(true)}
          />
        ) : (
          <Loader2Icon width={16} height={16} className={'animate-spin w-20'} />
        )}
      </PaginationItem>,
    ];
  };

  return (
    <Pagination>
      <PaginationContent>{renderPaginationItems()}</PaginationContent>
    </Pagination>
  );
};
