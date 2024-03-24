import { z } from 'zod';

export const embeddingCacheSchema = z.array(
  z.object({
    id: z.string(),
    metadata_id: z.string(),
    embedding: z.array(z.number()),
  })
);

export const similarIdsCacheSchema = z.array(z.string());

export const asyncEmbeddingGenerationSchema = z.object({
  id: z.string(),
});
