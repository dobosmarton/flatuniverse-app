'use client';

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
import { constructQueryParams } from './toolbar';

type Props = {
  searchParams: ArticleMetadataSearch;
  hasNextPage: boolean;
};

export const ArticleListPagination: React.FC<Props> = ({ searchParams, hasNextPage }) => {
  const pathname = usePathname();
  const page = searchParams.page ?? 1;

  const getNewPathname = (_page: number) => {
    const params = constructQueryParams(
      searchParams.search,
      searchParams.categoryGroups,
      searchParams.categories,
      searchParams.authors,
      searchParams.from,
      searchParams.to,
      _page
    );

    return `${pathname}?${params.toString()}`;
  };

  const renderPaginationItems = () => {
    const pageNumbers = [page];
    if (hasNextPage) {
      pageNumbers.push(page + 1);
    }
    if (page > 1) {
      pageNumbers.unshift(page - 1);
    }
    if (page === 4) {
      pageNumbers.unshift(2);
    }
    if (!pageNumbers.includes(1)) {
      pageNumbers.unshift(1);
    }

    const items = pageNumbers.reduce<JSX.Element[]>((acc, pageNumber, idx, array) => {
      if (array[idx - 1] && pageNumber - array[idx - 1] > 1) {
        acc.push(
          <PaginationItem key={`ellipsis-${pageNumber}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      acc.push(
        <PaginationItem key={pageNumber}>
          <PaginationLink href={getNewPathname(pageNumber)} isActive={pageNumber === page}>
            {pageNumber}
          </PaginationLink>
        </PaginationItem>
      );

      return acc;
    }, []);

    if (page > 1) {
      items.unshift(
        <PaginationItem key="previous">
          <PaginationPrevious href={getNewPathname(page - 1)} />
        </PaginationItem>
      );
    }

    if (hasNextPage) {
      items.push(
        <PaginationItem key="next">
          <PaginationNext href={getNewPathname(page + 1)} />
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Pagination>
      <PaginationContent>{renderPaginationItems()}</PaginationContent>
    </Pagination>
  );
};
