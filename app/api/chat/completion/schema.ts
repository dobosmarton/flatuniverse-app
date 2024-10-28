import { escapeHtml } from '@/lib/utils';
import { z } from 'zod';

export const chatCompletionSchema = z.object({
  threadSlug: z.string(),
  prompt: z.string().transform(escapeHtml),
});

export type ChatCompletion = z.infer<typeof chatCompletionSchema>;
