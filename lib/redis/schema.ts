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

export const hasEmbeddingsForArticleSchema = z.boolean();

export type EmbeddingData = z.infer<typeof embeddingCacheSchema>;
