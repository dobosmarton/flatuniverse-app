import { z } from 'zod';
import * as pagiantion from '../pagination';

export type SearchInput = {
  search?: string;
};

export const authorsByArticleInputSchema = z
  .object({
    search: z.string().optional(),
  })
  .and(pagiantion.paginationInputSchema);

export type AuthorsByArticleInput = z.infer<typeof authorsByArticleInputSchema>;
