import { escapeHtml } from '@/lib/utils';
import { z } from 'zod';

export const createNewThreadHeadersSchema = z.object({
  'X-Captcha-Token': z.string().nullable(),
});

export const createNewThreadDataSchema = z.object({
  prompt: z.string().transform(escapeHtml),
});

export type CreateNewThread = {
  headers: CreateNewThreadHeaders;
  data: CreateNewThreadData;
};

export type CreateNewThreadHeaders = z.input<typeof createNewThreadHeadersSchema>;

export type CreateNewThreadData = z.input<typeof createNewThreadDataSchema>;
