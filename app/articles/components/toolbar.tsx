'use client';

import { FacetFilter } from '@/components/facet-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBoundStore } from '@/stores';
import { Cross2Icon } from '@radix-ui/react-icons';
import { AIToggle } from './ai-toggle';

type Props = {
  categoryTree: {
    [groupName: string]: { key: string; value: string }[];
  };
};

export const Toolbar: React.FC<Props> = ({ categoryTree }) => {
  const {
    categoryGroups: selectedGroups,
    categories: selectedCategories,
    searchTerm,
    setCategoryGroups: setSelectedGroups,
    setCategories: setSelectedCategories,
    setSearchTerm,
  } = useBoundStore();

  const categoryGroups = Object.keys(categoryTree).map((groupName) => ({
    label: groupName,
    value: groupName,
  }));

  const categoryList = selectedGroups?.length
    ? Object.entries(categoryTree).reduce<{ label: string; value: string }[]>((acc, [groupName, categories]) => {
        if (selectedGroups?.includes(groupName)) {
          acc.push(...categories.map((category) => ({ label: category.value, value: category.key })));
        }
        return acc;
      }, [])
    : undefined;

  const isFiltered = selectedGroups?.length || searchTerm;

  const resetFilters = () => {
    setSelectedGroups(undefined);
    setSelectedCategories(undefined);
    setSearchTerm('');
  };

  const onSelectedGroupsChange = (groups: string[] | undefined) => {
    setSelectedGroups(groups);
    // Clear selected categories if the selected groups change
    // This is to prevent the selected categories from being out of sync with the selected groups
    setSelectedCategories(
      selectedCategories?.filter((category) =>
        Object.entries(categoryTree).some(([groupName, categories]) => {
          if (categories.some((cat) => cat.key === category)) {
            return groups?.includes(groupName);
          }
        })
      )
    );
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row md:gap-0 md:items-center md:justify-between">
      <div className="flex flex-col gap-2 md:flex-row md:flex-1 md:items-center">
        <Input
          placeholder="Filter articles..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="h-8 w-full md:w-[250px]"
        />

        <div className="flex flex-col gap-2 md:flex-row">
          <FacetFilter
            selectedValues={selectedGroups}
            setFilterValue={onSelectedGroupsChange}
            title="Category Groups"
            options={categoryGroups}
          />

          {categoryList?.length ? (
            <FacetFilter
              selectedValues={selectedCategories}
              setFilterValue={setSelectedCategories}
              title="Categories"
              options={categoryList}
            />
          ) : null}
        </div>

        {isFiltered && (
          <Button variant="ghost" onClick={resetFilters} className="h-8 px-2 lg:px-3">
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2 gap-2">
        <AIToggle />
        {/*  <ArticleLoadButton /> */}
      </div>
    </div>
  );
};
