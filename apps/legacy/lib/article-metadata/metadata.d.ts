import { article_metadata, author, category, link } from '@prisma/client';

export type ExtendedArticleMetadata = article_metadata & {
  authors: { author: Pick<author, 'name'> }[];
  categories: { category: Pick<category, 'short_name' | 'full_name' | 'group_name'> }[];
  links: { link: Pick<link, 'href' | 'rel' | 'type' | 'title'> }[];
};
