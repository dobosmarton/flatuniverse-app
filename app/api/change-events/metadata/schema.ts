import { z } from 'zod';

export const metadataChangeEventSchema = z.object({
  record: z.object({
    id: z.string().uuid(),
    external_id: z.string(),
  }),
  changes: z
    .object({
      id: z.string().uuid().optional(),
      external_id: z.string().optional(),
    })
    .nullish(),
  action: z.union([z.literal('insert'), z.literal('update'), z.literal('delete')]),
  metadata: z.object({
    table_schema: z.string(),
    table_name: z.string(),
    commit_timestamp: z.string(),
    consumer: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
});
