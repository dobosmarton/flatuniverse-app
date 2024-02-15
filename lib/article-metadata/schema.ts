import { z } from 'zod';
import { categoriesGroupedByShortName, ungroupedCategories } from './categories';

const authorSchema = z.object({
  name: z.string(),
});

const commentSchema = z
  .object({
    '#text': z.string(),
  })
  .transform((comment) => comment['#text']);

const linkSchema = z
  .object({
    '@_href': z.string(),
    '@_rel': z.string(),
    '@_type': z.string().optional(),
    '@_title': z.string().optional(),
  })
  .transform((link) => ({
    href: link['@_href'],
    rel: link['@_rel'],
    type: link['@_type'],
    title: link['@_title'],
  }));

const categorySchema = z
  .object({
    '@_term': z.string(),
    '@_scheme': z.string(),
  })
  .transform((category) => ({
    term: category['@_term'],
    scheme: category['@_scheme'],
    isPrimary: false,
  }));

const entrySchema = z
  .object({
    id: z.string().regex(/^http:\/\/arxiv\.org\/abs/),
    updated: z.string().datetime(),
    published: z.string().datetime(),
    title: z.string(),
    summary: z.string(),
    author: z.array(authorSchema).or(authorSchema),
    'arxiv:comment': commentSchema.optional(),
    link: z.array(linkSchema).or(linkSchema).optional().default([]),
    'arxiv:primary_category': categorySchema,
    category: z.array(categorySchema).or(categorySchema),
  })
  .transform(
    ({
      id,
      'arxiv:primary_category': primaryCategory,
      'arxiv:comment': comment,
      category,
      author,
      link,
      updated,
      published,
      ...rest
    }) => {
      const subCategories = Array.isArray(category) ? category : [category];
      const filteredSubCategories = subCategories.filter((category) => category.term !== primaryCategory.term);

      return {
        ...rest,
        id: id.replace('http://arxiv.org/abs/', '').trim(),
        comment,
        updated: new Date(updated),
        published: new Date(published),
        links: Array.isArray(link) ? link : [link],
        authors: Array.isArray(author) ? author : [author],
        categories: [...filteredSubCategories, { ...primaryCategory, isPrimary: true }],
      };
    }
  )
  .transform((entry) => ({
    ...entry,
    categories: entry.categories
      .filter((category) => !!categoriesGroupedByShortName[category.term])
      .map((category) => ({
        ...category,
        fullName: categoriesGroupedByShortName[category.term]?.longName ?? category.term,
        groupName: categoriesGroupedByShortName[category.term]?.group ?? ungroupedCategories,
      })),
  }));

export const articleMetadataSchema = z
  .object({
    id: z.string(),
    updated: z.string(),
    entry: z.array(entrySchema).or(entrySchema).optional(),
  })
  .transform(({ entry, ...rest }) => {
    let entries = entry ?? [];
    return {
      ...rest,
      entries: Array.isArray(entries) ? entries : [entries],
    };
  });

export type ArticleMetadata = z.infer<typeof articleMetadataSchema>;
export type ArticleMetadataEntry = z.infer<typeof entrySchema>;
export type Author = z.infer<typeof authorSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Link = z.infer<typeof linkSchema>;
