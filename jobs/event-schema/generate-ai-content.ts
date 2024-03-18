import { z } from 'zod';

export const generateAiContentSchema = z.array(
  z.object({
    externalId: z.string(),
  })
);
