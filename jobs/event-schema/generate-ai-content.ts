import { z } from 'zod';

export const generateAiContentSchema = z.array(
  z.object({
    id: z.string(),
    externalId: z.string(),
  })
);
