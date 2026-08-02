import { Schema } from 'effect';
import { categoriesByGroup } from './categories.js';

export type CategoryGroupName = keyof typeof categoriesByGroup;

export type Category = {
  readonly shortName: string;
  readonly longName: string;
  readonly groupName: CategoryGroupName;
};

const flatten = (): readonly Category[] =>
  Object.entries(categoriesByGroup).flatMap(([groupName, categories]) =>
    categories.map((category) => ({ ...category, groupName: groupName as CategoryGroupName }))
  );

export const allCategories: readonly Category[] = flatten();

const byShortName: ReadonlyMap<string, Category> = new Map(
  allCategories.map((category) => [category.shortName, category]),
);

export const groupNames: readonly CategoryGroupName[] = Object.keys(categoriesByGroup) as CategoryGroupName[];

export const findCategory = (shortName: string): Category | undefined => byShortName.get(shortName);

/**
 * arXiv occasionally emits categories outside the published taxonomy — aliases
 * and retired subject classes. Unknown values are dropped rather than stored,
 * so every category in the database resolves to a group for the browse UI.
 */
export const CategoryShortName = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((shortName: string) => byShortName.has(shortName) || 'not a known arXiv category', {
      identifier: 'CategoryShortName',
    }),
  ),
  Schema.brand('CategoryShortName'),
);

export type CategoryShortName = typeof CategoryShortName.Type;

/**
 * A type guard rather than a plain predicate, so `filter` narrows to the brand
 * without a cast. Membership of the taxonomy map *is* the brand's condition.
 */
const isKnownCategory = (shortName: string): shortName is CategoryShortName => byShortName.has(shortName);

export const keepKnownCategories = (shortNames: readonly string[]): readonly CategoryShortName[] =>
  shortNames.filter(isKnownCategory);
