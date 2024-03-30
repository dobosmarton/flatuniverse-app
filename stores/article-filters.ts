import { StateCreator } from 'zustand';
import { DateRange } from 'react-day-picker';
import { Store } from './index';

export type ArticleFilters = {
  categoryGroups: string[] | undefined;
  categories: string[] | undefined;
  authors: string[] | undefined;
  date: DateRange | undefined;
  searchTerm: string;
  setCategoryGroups: (categoryGroups: string[] | undefined) => void;
  toggleCategoryGroup: (categoryGroup: string) => void;
  setCategories: (categories: string[] | undefined) => void;
  toggleCategory: (categoryGroup: string, category: string) => void;
  setAuthors: (authors: string[] | undefined) => void;
  toggleAuthor: (author: string) => void;
  setDate: (date: DateRange | undefined) => void;
  setSearchTerm: (searchTerm: string) => void;
  isFiltered: () => boolean;
  resetFilters: () => void;
};

export const createArticleFiltersSlice: StateCreator<Store, [], [], ArticleFilters> = (set, get) => ({
  categoryGroups: undefined,
  categories: undefined,
  authors: undefined,
  date: undefined,
  searchTerm: '',
  setCategoryGroups: (categoryGroups: string[] | undefined) => set({ categoryGroups }),
  toggleCategoryGroup: (categoryGroup: string) =>
    set((state) => {
      const newCategoryGroups = state.categoryGroups?.includes(categoryGroup)
        ? state.categoryGroups.filter((group) => group !== categoryGroup)
        : [...(state.categoryGroups || []), categoryGroup];

      return { categoryGroups: newCategoryGroups.length ? newCategoryGroups : undefined };
    }),
  setCategories: (categories: string[] | undefined) => set({ categories }),
  toggleCategory: (categoryGroup: string, category: string) =>
    set((state) => {
      const _categoryGroup = state.categoryGroups?.includes(categoryGroup);

      // If the category group is not selected, select it and add the category
      if (!_categoryGroup) {
        return { categoryGroups: [...(state.categoryGroups ?? []), categoryGroup], categories: [category] };
      }

      const newCategories = state.categories?.includes(category)
        ? state.categories.filter((cat) => cat !== category)
        : [...(state.categories || []), category];

      return { categories: newCategories.length ? newCategories : undefined };
    }),
  setAuthors: (authors: string[] | undefined) => set({ authors }),
  toggleAuthor: (author: string) =>
    set((state) => {
      const newAuthors = state.authors?.includes(author)
        ? state.authors.filter((auth) => auth !== author)
        : [...(state.authors || []), author];

      return { authors: newAuthors.length ? newAuthors : undefined };
    }),
  setDate: (date: DateRange | undefined) => set({ date }),
  setSearchTerm: (searchTerm: string) => set({ searchTerm }),
  isFiltered: () => {
    const state = get();
    return (
      !!state.categoryGroups?.length || !!state.categories?.length || !!state.authors?.length || !!state.searchTerm
    );
  },
  resetFilters: () => set({ categoryGroups: undefined, categories: undefined, authors: undefined, searchTerm: '' }),
});
