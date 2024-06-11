import { z } from 'zod';

export const researchSyncPayloadSchema = z.object({
  startDate: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  untilDate: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
    .optional(),
  resumptionToken: z.string().optional(),
});

export type ResearchSyncPayload = z.input<typeof researchSyncPayloadSchema>;
