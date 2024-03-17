import { z } from 'zod';
import { researchSyncPayloadSchema } from './sync-research';

export const researchSyncRetryPayloadSchema = researchSyncPayloadSchema.extend({
  retryAfter: z.string().optional(),
  retryCount: z.number(),
});
