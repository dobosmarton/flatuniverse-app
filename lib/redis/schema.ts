import { z } from 'zod';

export const embeddingCacheSchema = z.array(
  z.object({
    id: z.string(),
    values: z.array(z.number()),
  })
);

export const similarIdsCacheSchema = z.array(z.string());

export const temporalAnalysisSchema = z.object({
  isTemporalQuery: z.boolean().nullable(),
  timeFrame: z
    .object({
      start: z
        .string()
        .datetime()
        .transform((val) => new Date(val)),
      end: z
        .string()
        .datetime()
        .transform((val) => new Date(val)),
    })
    .nullable(),
  temporalWeight: z.number().nullable().default(0),
});

export type TemporalAnalysis = z.output<typeof temporalAnalysisSchema>;

export const asyncEmbeddingGenerationSchema = z.object({
  id: z.string(),
});

export const authorsByArticleCacheSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    count: z.number(),
  })
);

export const getArticleMetadataBySlugCacheSchema = z.object({
  id: z.string(),
  title: z.string(),
  abstract: z.string(),
  generated_summary: z.string().nullable(),
  slug: z.string(),
  updated_at: z.string().datetime(),
  updated: z.string().datetime(),
  published: z.string().datetime(),
  created_at: z.string().datetime(),
  external_id: z.string(),
  comment: z.string().nullable(),
  authors: z.array(z.object({ author: z.object({ name: z.string() }) })),
  categories: z.array(
    z.object({ category: z.object({ short_name: z.string(), full_name: z.string(), group_name: z.string() }) })
  ),
  links: z.array(
    z.object({ link: z.object({ href: z.string(), rel: z.string(), type: z.string(), title: z.string() }) })
  ),
});

export const getArticleWithPdfLinkCacheSchema = z.object({
  id: z.string(),
  published: z.number(),
  pdfLink: z.string().nullable(),
});

export type GetArticleWithPdfLinkCache = z.infer<typeof getArticleWithPdfLinkCacheSchema>;

export const findLatestMetadataByExternalIdsCacheSchema = z.array(z.string());

export const hasEmbeddingsForArticleSchema = z.boolean();

export type EmbeddingData = z.infer<typeof embeddingCacheSchema>;
