import { z } from 'zod';
import { metadataSchema } from '@/lib/oai-pmh/schema';

export enum Events {
  research_sync = 'research_sync',
  research_sync_retry = 'research_sync_retry',
  add_article_metadata_batch = 'add_article_metadata_batch',
}

export const researchSyncPayloadSchema = z.object({
  startDate: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  untilDate: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
    .optional(),
  resumptionToken: z.string().optional(),
});

export const researchSyncRetryPayloadSchema = researchSyncPayloadSchema.extend({
  retryAfter: z.string().optional(),
  retryCount: z.number(),
});

export const addArticleMetadaBatchPayloadSchema = z.object({
  batchIndex: z.number(),
  batch: z.array(metadataSchema),
});
