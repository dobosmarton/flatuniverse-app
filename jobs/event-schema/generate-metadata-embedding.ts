import { z } from 'zod';

export const generateMetadataEmbeddingPayloadSchema = z.object({
  itemId: z.string(),
});

export type GenerateMetadataEmbeddingPayload = z.infer<typeof generateMetadataEmbeddingPayloadSchema>;
