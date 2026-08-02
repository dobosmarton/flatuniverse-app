import { z } from 'zod';

export const categoryFindSchema = z.object({
  groupNames: z.array(z.string()).optional(),
});

export type CategoryFind = z.infer<typeof categoryFindSchema>;
