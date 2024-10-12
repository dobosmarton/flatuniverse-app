import { z } from 'zod';

export const generateAiContentPayloadSchema = z.object({
  jobId: z.string(),
  data: z.array(
    z.object({
      articleMetadataId: z.string(),
      externalId: z.string(),
    })
  ),
});

export type GenerateAiContentPayload = z.input<typeof generateAiContentPayloadSchema>;
