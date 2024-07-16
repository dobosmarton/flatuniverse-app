import { z } from 'zod';

export const embeddingCacheSchema = z.array(
  z.object({
    id: z.string(),
    values: z.array(z.number()),
  })
);

export const similarIdsCacheSchema = z.array(z.string());

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
