import { escapeHtml } from '@/lib/utils';
import { z } from 'zod';

export const chatCompletionSchema = z.object({
  prompt: z.string().transform(escapeHtml),
});

export type ChatCompletion = z.infer<typeof chatCompletionSchema>;
