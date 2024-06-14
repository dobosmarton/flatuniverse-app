import { z } from 'zod';

export const generateEmbeddingPayloadSchema = z.object({
  jobId: z.string(),
  itemId: z.string(),
  // Document<PDFMetadata<{ metadata_id: string }>>[]
  doc: z.array(
    z.object({
      pageContent: z.string(),
      metadata: z.object({
        pdf: z.object({
          totalPages: z.number(),
        }),
        loc: z.object({
          pageNumber: z.number(),
        }),
        article: z.object({
          metadata_id: z.string(),
        }),
      }),
    })
  ),
});

export type GenerateEmbeddingPayload = z.infer<typeof generateEmbeddingPayloadSchema>;
//
