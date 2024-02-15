import { StateCreator } from 'zustand';
import { Store } from './index';

export type ArticleFilters = {
  categoryGroups: string[] | undefined;
  categories: string[] | undefined;
  searchTerm: string;
  setCategoryGroups: (categoryGroups: string[] | undefined) => void;
  toggleCategoryGroup: (categoryGroup: string) => void;
  setCategories: (categories: string[] | undefined) => void;
  toggleCategory: (categoryGroup: string, category: string) => void;
  setSearchTerm: (searchTerm: string) => void;
};

export const createArticleFiltersSlice: StateCreator<Store, [], [], ArticleFilters> = (set) => ({
  categoryGroups: undefined,
  categories: undefined,
  searchTerm: '',
  setCategoryGroups: (categoryGroups: string[] | undefined) => set({ categoryGroups }),
  toggleCategoryGroup: (categoryGroup: string) =>
    set((state) => {
      const newCategoryGroups = state.categoryGroups?.includes(categoryGroup)
        ? state.categoryGroups.filter((group) => group !== categoryGroup)
        : [...(state.categoryGroups || []), categoryGroup];

      return { categoryGroups: newCategoryGroups };
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

      return { categories: newCategories };
    }),
  setSearchTerm: (searchTerm: string) => set({ searchTerm }),
});
