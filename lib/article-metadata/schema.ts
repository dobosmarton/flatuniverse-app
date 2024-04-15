import { z } from 'zod';

const jsonSchema = z.lazy(() => z.array(z.number()));

const json = () => jsonSchema;

export const embeddingDataSchema = z.array(
  z.object({
    id: z.string(),
    metadata_id: z.string(),
    embedding: z.string().transform((str, ctx): z.infer<ReturnType<typeof json>> => {
      try {
        const parsed = JSON.parse(str);
        return jsonSchema.parse(parsed);
      } catch (e) {
        ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
        return z.NEVER;
      }
    }),
  })
);

const articleMetadataSearchParamsSchema = z
  .object({
    search: z.string().nullable().optional(),
    groups: z.string().nullable().optional(),
    categories: z.string().nullable().optional(),
    authors: z.string().nullable().optional(),
    from: z.string().nullable().optional(),
    to: z.string().nullable().optional(),
    page: z.string().nullable().optional().default('1'),
    pageSize: z.string().nullable().optional().default('10'),
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
    page: data?.page ? parseInt(data.page) : 1,
    pageSize: data?.pageSize ? parseInt(data.pageSize) : undefined,
  };
});

export type EmbeddingData = z.infer<typeof embeddingDataSchema>;
export type ArticleMetadataSearch = z.infer<typeof articleMetadataSearchSchema>;
