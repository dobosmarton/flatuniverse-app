'use client';

import React, { startTransition, useEffect, useState } from 'react';
import { ChevronsDownUpIcon, ChevronsUpDownIcon, Loader2Icon, MessageCircleIcon, Settings2Icon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import posthog from 'posthog-js';
import { FacetFilter } from '@/components/facet-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBoundStore } from '@/stores';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Author } from '@/lib/authors';
import { AuthorFacetFilter } from '@/components/author-facet-filter';
import { DatePickerWithRange } from '@/components/date-range-picker';
import { ArticleMetadataSearch } from '@/lib/article-metadata/schema';
import { constructQueryParams } from '@/lib/query-params';
import { events } from '@/lib/analytics';
import { SidebarTrigger } from '@/components/ui/sidebar';

type Props = {
  categoryTree: {
    [groupName: string]: { key: string; value: string }[];
  };
  authors: Author[];
  searchParams: ArticleMetadataSearch;
};

const isFiltered = (searchParams: ArticleMetadataSearch): boolean => {
  return Boolean(
    searchParams.categoryGroups?.length ??
      searchParams.categories?.length ??
      searchParams.authors?.length ??
      (searchParams.search || searchParams.from || searchParams.to)
  );
};

export const Toolbar: React.FC<Props> = ({ categoryTree, authors, searchParams }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(isFiltered(searchParams));
  const { isCompactMode, toggleCompactMode, isContextChatOpen, toggleContextChat } = useBoundStore();

  const pathname = usePathname();
  const { push } = useRouter();
  const [searchState, setSearchState] = useState<ArticleMetadataSearch>(searchParams);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [queryParams] = useDebounce(
    constructQueryParams({
      searchTerm: searchState.search,
      categoryGroups: searchState.categoryGroups,
      categories: searchState.categories,
      authors: searchState.authors,
      from: searchState.from,
      to: searchState.to,
    }).toString(),
    300
  );

  useEffect(() => {
    setSearchState(searchParams);
    setIsSearchLoading(false);
    if (!isFilterOpen && isFiltered(searchParams)) {
      setIsFilterOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    posthog.capture(events.articlesFilter, {
      search: searchState.search,
      categoryGroups: searchState.categoryGroups,
      categories: searchState.categories,
      authors: searchState.authors,
      from: searchState.from,
      to: searchState.to,
    });

    startTransition(() => {
      push(`${pathname}?${queryParams}`);
    });
  }, [queryParams]);

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsSearchLoading(true);
    setSearchState((state) => ({ ...state, search: event.target.value }));
  };

  const resetFilters = () =>
    setSearchState((state) => ({
      ...state,
      categoryGroups: undefined,
      categories: undefined,
      authors: undefined,
      from: undefined,
      to: undefined,
      search: '',
    }));

  const categoryGroups = Object.keys(categoryTree).map((groupName) => ({
    label: groupName,
    value: groupName,
  }));

  const categoryList = searchState.categoryGroups?.length
    ? Object.entries(categoryTree).reduce<{ label: string; value: string }[]>((acc, [groupName, categories]) => {
        if (searchState.categoryGroups?.includes(groupName)) {
          acc.push(...categories.map((category) => ({ label: category.value, value: category.key })));
        }
        return acc;
      }, [])
    : undefined;

  const onSelectedGroupsChange = (groups: string[] | undefined) => {
    // Clear selected categories if the selected groups change
    // This is to prevent the selected categories from being out of sync with the selected groups
    setSearchState((state) => ({
      ...state,
      categoryGroups: groups,
      categories: state.categories?.filter((category) =>
        Object.entries(categoryTree).some(([groupName, categories]) => {
          if (categories.some((cat) => cat.key === category)) {
            return groups?.includes(groupName);
          }
        })
      ),
    }));
  };

  return (
    <div className="flex flex-col gap-2 sticky top-0 z-10 bg-background py-4 px-2 md:px-8 border-b drop-shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex px-2 md:hidden">
          <SidebarTrigger className="w-4 h-4" />
        </div>
        <Input
          placeholder="Filter articles..."
          value={searchState.search}
          onChange={onSearchChange}
          className="h-8 w-full md:w-[360px]"
        />

        {isSearchLoading ? (
          <Button variant="default" size="sm" className="h-8 font-normal">
            <Loader2Icon className="h-4 w-4 animate-spin" />
          </Button>
        ) : null}

        {!isSearchLoading ? (
          <Button
            variant={isFilterOpen ? 'default' : 'outline'}
            size="sm"
            className="h-8 font-normal"
            onClick={() => setIsFilterOpen((open) => !open)}>
            <Settings2Icon className="h-4 w-4" />
          </Button>
        ) : null}

        <Button
          variant={isCompactMode ? 'default' : 'outline'}
          size="sm"
          className="h-8 font-normal"
          disabled={isSearchLoading}
          onClick={toggleCompactMode}>
          {isCompactMode ? <ChevronsUpDownIcon className="h-4 w-4" /> : <ChevronsDownUpIcon className="h-4 w-4" />}
        </Button>
        <Button
          variant={isContextChatOpen ? 'default' : 'outline'}
          size="sm"
          className="h-8 font-normal"
          disabled={isSearchLoading}
          onClick={toggleContextChat}>
          <MessageCircleIcon className="h-4 w-4" />
        </Button>
      </div>
      {isFilterOpen ? (
        <div className="flex flex-col gap-2 md:flex-row md:gap-0 md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:flex-1 md:items-center">
            <div className="flex flex-col gap-2 md:flex-row">
              <FacetFilter
                selectedValues={searchState.categoryGroups}
                setFilterValue={onSelectedGroupsChange}
                title="Category Groups"
                options={categoryGroups}
              />

              {categoryList?.length ? (
                <FacetFilter
                  selectedValues={searchState.categories}
                  setFilterValue={(categories) => setSearchState((state) => ({ ...state, categories }))} //setSelectedCategories(categories)}
                  title="Categories"
                  options={categoryList}
                />
              ) : null}
            </div>

            <AuthorFacetFilter
              authors={authors}
              selectedAuthors={searchState.authors}
              setSelectedAuthors={(authors) => setSearchState((state) => ({ ...state, authors }))}
            />

            <DatePickerWithRange
              from={searchState.from}
              to={searchState.to}
              setDate={(date) => setSearchState((state) => ({ ...state, from: date?.from, to: date?.to }))}
            />

            {isFiltered(searchState) && (
              <Button variant="ghost" onClick={resetFilters} className="h-8 px-2 lg:px-3">
                Reset
                <Cross2Icon className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
