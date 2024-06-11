import { z } from 'zod';

export const generateAiContentSchema = z.array(
  z.object({
    externalId: z.string(),
  })
);

export type GenerateAiContent = z.input<typeof generateAiContentSchema>;
