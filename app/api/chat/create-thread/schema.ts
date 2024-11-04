import { escapeHtml } from '@/lib/utils';
import { z } from 'zod';

export const createNewThreadSchema = z.object({
  prompt: z.string().transform(escapeHtml),
});

export type CreateNewThread = z.infer<typeof createNewThreadSchema>;
