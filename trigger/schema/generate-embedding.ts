import { z } from 'zod';

export const generateEmbeddingPayloadSchema = z.object({
  jobId: z.string(),
  itemId: z.string(),
  // TextNode<{ metadata_id: string }>[]
  nodes: z.array(
    z.object({
      getEmbedding: z.function().returns(z.array(z.number())),
      metadata: z.object({
        metadata_id: z.string(),
      }),
    })
  ),
});

export type GenerateEmbeddingPayload = z.infer<typeof generateEmbeddingPayloadSchema>;
//
