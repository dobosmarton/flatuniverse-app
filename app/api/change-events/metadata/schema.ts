import { z } from 'zod';

export const metadataChangeEventSchema = z.object({
  record: z.object({
    external_id: z.string(),
  }),
  changes: z
    .object({
      external_id: z.string(),
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
