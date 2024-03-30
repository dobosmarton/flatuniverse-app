'use client';

import React from 'react';
import useSWR from 'swr';
import { Author } from '@/lib/authors';
import { useBoundStore } from '@/stores';
import { useDebounce } from '@/hooks/useDebounce';
import { fetcher } from '@/lib/api-client/fetch';
import { FacetFilter } from './facet-filter';

type Props = {
  authors: Author[];
};

const constructQueryParams = (searchTerm: string, page = 0) => {
  const params: Record<string, string> = {
    page: page.toString(),
  };
  if (searchTerm) {
    params.search = searchTerm;
  }

  return new URLSearchParams(params);
};

export const AuthorFacetFilter: React.FC<Props> = ({ authors }) => {
  const { authors: selectedAuthors, setAuthors: setSelectedAuthors } = useBoundStore();
  const [authorSearchTerm, setAuthorSearchTerm] = React.useState('');

  const debouncedAuthorSearch = useDebounce(authorSearchTerm, 200);

  const { data, isLoading } = useSWR<Author[] | null>(
    '/api/authors/search?' + constructQueryParams(debouncedAuthorSearch),
    (url) => fetcher<Author[]>(url),
    {
      fallbackData: authors,
      fallback: authors,
      keepPreviousData: true,
    }
  );

  // Client side filtering
  // This is to prevent the UI from flickering when the user changes the filters
  // The server side filtering is still necessary to prevent the client from fetching all the articles
  const clientSideFilteredArticles = isLoading
    ? data?.filter((author) => {
        if (debouncedAuthorSearch) {
          return author.name.toLocaleLowerCase().includes(debouncedAuthorSearch.toLocaleLowerCase());
        }

        return true;
      })
    : null;

  const authorList = (clientSideFilteredArticles ?? data ?? []).map((author) => ({
    label: `${author.name} (${author.count})`,
    value: author.name,
  }));

  return (
    <FacetFilter
      inputValue={authorSearchTerm}
      selectedValues={selectedAuthors}
      setFilterValue={setSelectedAuthors}
      title="Authors"
      options={authorList}
      onInputValueChange={setAuthorSearchTerm}
      shouldFilter={false}
    />
  );
};
