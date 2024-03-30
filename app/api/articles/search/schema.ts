import { z } from 'zod';

const articleMetadataSearchParamsSchema = z
  .object({
    search: z.string().nullable(),
    groups: z.string().nullable(),
    categories: z.string().nullable(),
    authors: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string().nullable(),
    page: z.string().nullable().default('0'),
    pageSize: z.string().nullable().default('10'),
  })
  .optional();

export const articleMetadataSearchSchema = articleMetadataSearchParamsSchema.transform((data) => {
  return {
    search: data?.search ?? '',
    categoryGroups: data?.groups?.split(',') ?? undefined,
    categories: data?.categories?.split(',') ?? undefined,
    authors: data?.authors?.split(',') ?? undefined,
    from: data?.from ? new Date(data.from) : undefined,
    to: data?.to ? new Date(data.to) : undefined,
    page: data?.page ? parseInt(data.page) : undefined,
    pageSize: data?.pageSize ? parseInt(data.pageSize) : undefined,
  };
});

export type ArticleMetadataSearchParams = z.infer<typeof articleMetadataSearchParamsSchema>;
export type ArticleMetadataSearch = z.infer<typeof articleMetadataSearchSchema>;
